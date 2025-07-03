import { CustomTransportStrategy, Server } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { Options } from 'amqplib';
import { RabbitClient, RabbitClientInstance } from './rabbitmq.client';
import { ConnectedMsg, DisconnectedMsg } from './types';
import { RabbitmqStrategy, StrategyOptsMap, StrategyPackageMeta } from './meta';

/**
 * Custom RabbitMQ transporter for NestJS microservices.
 * Supports multiple queue strategies and event hooks.
 */
export class RabbitTransporter
  extends Server
  implements CustomTransportStrategy
{
  private readonly rabbitClient: RabbitClient;
  private readonly eventListeners: Map<string, Function[]>;

  declare protected logger: Logger;

  constructor(private readonly options: Options.Connect) {
    super();

    this.rabbitClient = RabbitClientInstance;
    this.eventListeners = new Map<string, Function[]>();
    this.logger = new Logger(RabbitTransporter.name);

    this.on(`connect`, (msg: ConnectedMsg) =>
      this.logger.log(`Connected to ${msg.host}:${msg.port}`),
    );
  }

  /**
   * Initializes the connection and sets up all queues
   * based on the provided handler metadata.
   */
  public async listen(callback: () => void): Promise<void> {
    await this.rabbitClient.connect(this.options);
    await this.emitEvent<ConnectedMsg>(`connect`, {
      port: this.options.port,
      host: this.options.hostname,
    });

    for (const [_, handler] of this.messageHandlers) {
      const meta = handler.extras.meta as StrategyPackageMeta<
        keyof StrategyOptsMap
      >;
      const handlerCallback = async (...args: unknown[]) =>
        handler(args[0], args[1]);

      if (meta?.type === RabbitmqStrategy.PURE_QUEUE) {
        await this.rabbitClient.assertPureQueue(meta.opts, handlerCallback);
      }
      if (meta?.type === RabbitmqStrategy.TERNARY_QUEUE) {
        await this.rabbitClient.assertTernaryQueue(meta.opts, handlerCallback);
      }
    }

    callback();
  }

  /**
   * Gracefully closes the RabbitMQ connection and emits a shutdown event.
   */
  public async close(): Promise<void> {
    await this.rabbitClient.close();
    await this.emitEvent<DisconnectedMsg>(`disconnect`, {
      reason: 'app shutdown',
    });
  }

  /**
   * Registers a listener for a custom internal event.
   */
  public on(event: string, callback: Function): void {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).push(callback);
    }
    this.eventListeners.set(event, [callback]);
  }

  /**
   * Returns the underlying RabbitMQ client instance.
   */
  public unwrap<T = RabbitClient>(): T {
    return this.rabbitClient as T;
  }

  /**
   * Emits a custom internal event to all registered listeners.
   */
  public async emitEvent<T = any>(event: string, payload?: T): Promise<void> {
    const callbacks = this.eventListeners.get(event) || [];
    for (const callback of callbacks) {
      try {
        await callback(payload);
      } catch (err) {
        if (err instanceof Error || Object.hasOwn(err, 'message')) {
          this.logger.error(err.message);
        }
      }
    }
  }
}
