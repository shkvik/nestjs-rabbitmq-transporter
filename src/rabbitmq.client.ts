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
import { once } from 'node:events';
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
  private channelModel: ChannelModel;
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
      this.channelModel = await connect(opts);
      this.channel = await this.channelModel.createConfirmChannel();
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
    const channel = await this.channelModel.createChannel();
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
        try {
          const result = await executeNestjsHandler(data, ctx, callback);
          await lastValueFrom(result);

          switch (opts?.consumeOpts?.ackPolicy) {
            case AckPolicy.OFF:
              break;
            default:
              channel.ack(msg);
              break;
          }
        } catch (err) {
          if (err instanceof Error || Object.hasOwn(err, 'message')) {
            this.logger.error(
              `Process in "${opts.name}" failed; error: ${err.message}`,
            );
          }
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
        }
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

    const channel = await this.channelModel.createChannel();

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
            routingKey: archiveQueue,
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
    content: Buffer;
    routingKey: string;
    options?: Options.Publish;
    exchange?: string;
  }): Promise<void> {
    const { routingKey, content, options, exchange } = params;
    const ok = this.channel.publish(exchange, routingKey, content, options);
    if (!ok) {
      await once(this.channel, 'drain');
    }
  }

  /**
   * Publishes a message reliably, waiting for broker confirmation (ACK/NACK),
   * handling back-pressure, unroutable returns, channel errors/closures, and timing out if no response.
   *
   * @param params.content    - The message payload as a Buffer.
   * @param params.routingKey - The routing key or queue name to publish to.
   * @param params.options    - Optional AMQP publish options (headers, persistent flag, etc.).
   * @param params.exchange   - Optional exchange name (defaults to the default exchange `''`).
   * @returns A Promise that:
   *   - resolves once RabbitMQ ACKs the message,
   *   - rejects if the broker NACKs it, if the channel errors/closes, if the message is unroutable,
   *     or if no confirmation arrives within the timeout window.
   */
  public async publishConfirmed(params: {
    content: Buffer;
    routingKey: string;
    options?: Options.Publish;
    exchange?: string;
  }): Promise<void> {
    const { exchange = '', routingKey, content, options } = params;
    const timeoutMs = 5000;

    // 1) Publish with mandatory flag; await drain if back-pressure signals a full buffer.
    const ok = this.channel.publish(exchange, routingKey, content, {
      ...options,
      mandatory: true,
    });
    if (!ok) {
      this.logger.debug(`Back-pressure: waiting for drain`);
      await once(this.channel, 'drain');
    }

    // 2) Prepare all waiters: confirm, error, close, return, and timeout.
    const controller = new AbortController();
    const { signal } = controller;

    const confirmP = this.channel.waitForConfirms();
    const errorP = once(this.channel, 'error', { signal }).then(([err]) => {
      throw err;
    });
    const closeP = once(this.channel, 'close', { signal }).then(() => {
      throw new Error('Channel closed');
    });
    const returnP = once(this.channel, 'return', { signal }).then(() => {
      throw new Error(`Unroutable for ${routingKey}`);
    });

    let timeoutId: NodeJS.Timeout;
    const timeoutP = new Promise<never>((_, rej) => {
      timeoutId = setTimeout(
        () => rej(new Error(`Publish timeout after ${timeoutMs}ms`)),
        timeoutMs,
      );
    });

    // 3) Race all of them and handle outcome.
    try {
      await Promise.race([confirmP, errorP, closeP, returnP, timeoutP]);
    } catch (err: any) {
      this.logger.error(
        `Failed to publish to ${exchange}/${routingKey}: ${err.message}`,
        err.stack,
      );
      throw err;
    } finally {
      clearTimeout(timeoutId);
      controller.abort();
    }
  }

  /**
   * Gracefully closes the channel and connection to RabbitMQ.
   */
  public async close(): Promise<void> {
    if (!this.isConnected()) {
      return;
    }
    if (this.channel) {
      await this.channel.close();
    }
    if (this.channelModel) {
      await this.channelModel.close();
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
        await this.channel.assertExchange(name, type, options);
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
