import {
  AckPolicy,
  NackPolicy,
  PureQueueOpts,
  RabbitContext,
  RabbitExchange,
  TernaryQueueOpts,
} from './types';
import {
  connect,
  ChannelModel,
  Options,
  ConfirmChannel,
  ConsumeMessage,
} from 'amqplib';
import { Logger } from '@nestjs/common';
import { lastValueFrom, Observable } from 'rxjs';
import {
  createArchiveQueue,
  createMainQueue,
  createRetryQueue,
  executeNestjsHandler,
} from './utilities';

/**
 * RabbitClient — low-level RabbitMQ wrapper that manages connection, channels,
 * queue setup, publishing, and message consumption logic for different strategies.
 */
export class RabbitClient {
  private logger: Logger;
  private connected: boolean;
  private connecting: boolean;
  private channel: ConfirmChannel;
  private connection: ChannelModel;
  private exchangeSet: Set<string>;

  constructor() {
    this.logger = new Logger(RabbitClient.name);
    this.exchangeSet = new Set();
  }

  /**
   * Establishes connection to RabbitMQ and opens a confirm channel.
   */
  public async connect(opts: Options.Connect): Promise<void> {
    try {
      if (this.connecting || this.connected) {
        return;
      }
      this.connecting = true;
      this.connection = await connect(opts);
      this.channel = await this.connection.createConfirmChannel();
      this.connected = true;
    } catch (err) {
      if (err instanceof Error) {
        this.logger.error(`rabbitmq client connection failed: ${err.message}`);
      }
      this.connected = false;
      throw err;
    } finally {
      this.connecting = false;
    }
  }

  /**
   * Asserts a basic "pure" queue and starts consuming it using a provided handler.
   * Optionally binds the queue to exchanges and handles ack/nack policies.
   */
  public async assertPureQueue(
    opts: PureQueueOpts,
    callback: (
      ...args: unknown[]
    ) => Promise<Observable<unknown>> | Promise<unknown>,
  ): Promise<void> {
    const channel = await this.connection.createChannel();
    await channel.assertQueue(opts.name, opts.queueOpts);

    if (opts?.exchanges) {
      await this.bindExchanges(opts.name, opts.exchanges);
    }

    channel.consume(
      opts.name,
      async (msg: ConsumeMessage) => {
        const data = this.decode(msg.content);
        const ctx = {
          msg,
          channel,
        } as RabbitContext;
        const result = await executeNestjsHandler(data, ctx, callback);
        result.subscribe({
          complete: () => {
            switch (opts?.consumeOpts?.ackPolicy) {
              case AckPolicy.OFF:
                break;
              default:
                channel.ack(msg);
                break;
            }
          },
          error: () => {
            switch (opts?.consumeOpts?.nackPolicy) {
              case NackPolicy.OFF:
                break;
              case NackPolicy.REQUEUE:
                channel.nack(msg, false, true);
                break;
              case NackPolicy.DLX:
                channel.nack(msg, false, false);
                break;
              default:
                channel.ack(msg);
                break;
            }
          },
        });
      },
      opts.consumeOpts,
    );
  }

  /**
   * Asserts a 3-stage retryable queue (main → retry → archive),
   * and consumes from the main queue with retry and archive logic.
   */
  public async assertTernaryQueue(
    opts: TernaryQueueOpts,
    callback: (
      ...args: unknown[]
    ) => Promise<Observable<unknown>> | Promise<unknown>,
  ): Promise<void> {
    opts.attempts ??= 3;
    opts.ttl ??= 5000;

    const mainQueue = `${opts.name}.main.queue`;
    const archiveQueue = `${opts.name}.archive.queue`;

    const channel = await this.connection.createChannel();

    await createMainQueue(opts.name, channel);
    await createRetryQueue(opts.name, channel, opts.ttl);
    await createArchiveQueue(opts.name, channel);

    if (opts?.exchanges) {
      await this.bindExchanges(mainQueue, opts.exchanges);
    }

    channel.consume(mainQueue, async (msg) => {
      const data = this.decode(msg.content);
      const ctx = { msg, channel } as RabbitContext;
      const xDeath = msg?.properties?.headers['x-death'];
      const attempt = xDeath ? xDeath[0].count : 0;

      try {
        if (xDeath && xDeath?.length && xDeath[0].count >= opts.attempts) {
          await this.publish({
            queue: archiveQueue,
            content: this.encode(data),
          });
          this.logger.error(`Dispatch to archive → ${archiveQueue}`);
        } else {
          const result = await executeNestjsHandler(data, ctx, callback);
          await lastValueFrom(result);
        }
        channel.ack(msg);
      } catch (err) {
        if (err instanceof Error || Object.hasOwn(err, 'message')) {
          this.logger.error(
            `Process in "${mainQueue}" failed; attempt №${attempt + 1}; error: ${err.message}`,
          );
        }
        channel.nack(msg, false, false);
      }
    });
  }

  /**
   * Publishes a message to a queue or exchange with optional publish options.
   */
  public async publish(params: {
    queue: string;
    content: Buffer;
    options?: Options.Publish;
    exchange?: string;
  }): Promise<void> {
    const { queue, content, options, exchange } = params;
    return new Promise<void>((resolve, reject) => {
      this.channel.publish(exchange, queue, content, options, (err, _) => {
        if (err) {
          if (err instanceof Error) {
            this.logger.error(err.message);
          }
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Gracefully closes the channel and connection to RabbitMQ.
   */
  public async close(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
    this.connected = false;
    this.logger.log('Connection closed.');
  }

  /**
   * Returns current connection status.
   */
  public isConnected(): boolean {
    return this.connected;
  }

  /**
   * Serializes any input to a UTF-8 buffer for publishing.
   */
  public encode(data: unknown): Buffer {
    return Buffer.from(
      typeof data === 'object' ? JSON.stringify(data) : String(data),
    );
  }

  /**
   * Attempts to parse a UTF-8 buffer back to JSON or string.
   */
  public decode(data: Buffer): unknown | string {
    const raw = data.toString('utf-8');
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }

  /**
   * Returns the active confirm channel.
   */
  public getChannel(): ConfirmChannel {
    return this.channel;
  }

  /**
   * Asserts and binds the provided exchanges to the target queue.
   * Ensures each exchange is declared only once.
   */
  private async bindExchanges(
    queue: string,
    exchanges: RabbitExchange[],
  ): Promise<void> {
    for (const exchange of exchanges) {
      const { name, type, options } = exchange;
      if (!this.exchangeSet.has(exchange.name)) {
        this.channel.assertExchange(name, type, options);
        this.exchangeSet.add(name);
      }
      await this.channel.bindQueue(queue, name, `${queue}.key`);
    }
  }
}

/**
 * Singleton instance of RabbitClient.
 */
export const RabbitClientInstance = new RabbitClient();
