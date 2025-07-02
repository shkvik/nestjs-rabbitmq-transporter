import {
  CustomTransportStrategy,
  MessageHandler,
  Server,
} from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { Options } from 'amqplib';
import { RabbitClient, RabbitClientInstance } from './rabbitmq.client';
import { ConnectedMsg, PureQueueOpts, TernaryQueueOpts } from './types';
import { RabbitmqStrategy, StrategyOptsMap, StrategyPackageMeta } from './meta';

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
      if (meta?.type === RabbitmqStrategy.PURE_QUEUE) {
        await this.setPureQueueHandler(meta.opts, handler);
      }
      if (meta?.type === RabbitmqStrategy.TERNARY_QUEUE) {
        await this.setTernaryQueueHandler(meta.opts, handler);
      }
    }

    callback();
  }

  public async close(): Promise<void> {
    await this.rabbitClient.close();
  }

  public on(event: string, callback: Function): void {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).push(callback);
    }
    this.eventListeners.set(event, [callback]);
  }

  public unwrap<T = RabbitClient>(): T {
    return this.rabbitClient as T;
  }

  private async setPureQueueHandler(
    opts: PureQueueOpts,
    handler: MessageHandler,
  ): Promise<void> {
    await this.rabbitClient.assertPureQueue({
      opts,
      callback: async (...args) => handler(args[0], args[1]),
    });
  }

  private async setTernaryQueueHandler(
    opts: TernaryQueueOpts,
    handler: MessageHandler,
  ): Promise<void> {
    await this.rabbitClient.assertTernaryQueue({
      opts,
      callback: async (...args) => handler(args[0], args[1]),
    });
  }

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
