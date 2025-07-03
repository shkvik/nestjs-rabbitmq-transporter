import { ClientProxy, ReadPacket, WritePacket } from '@nestjs/microservices';
import { Injectable, Logger } from '@nestjs/common';
import { Options } from 'amqplib';
import { RabbitPayload } from './types/rabbitmq.payload';
import { RabbitClient, RabbitClientInstance } from './rabbitmq.client';

/**
 * RabbitProxy — a NestJS ClientProxy adapter for sending messages to RabbitMQ.
 * Primarily used for fire-and-forget event dispatching (not RPC).
 */
@Injectable()
export class RabbitProxy extends ClientProxy {
  private readonly logger = new Logger(RabbitProxy.name);
  private readonly rabbitClient: RabbitClient;

  constructor(private readonly connectionOpts: Options.Connect) {
    super();
    this.rabbitClient = RabbitClientInstance;
  }

  /**
   * Establishes a connection to RabbitMQ.
   */
  public async connect(): Promise<void> {
    await this.rabbitClient.connect(this.connectionOpts);
  }

  /**
   * Closes the connection to RabbitMQ.
   */
  public async close(): Promise<any> {
    await this.rabbitClient.close();
  }

  /**
   * RPC publish is not used here.
   * Override this if you need RPC functionality.
   */
  protected publish(
    _: ReadPacket,
    __: (packet: WritePacket) => void,
  ): () => void {
    this.logger.warn(
      'RabbitProxy.publish() (RPC) called; implement custom logic if needed.',
    );
    return () => {};
  }

  /**
   * Sends a fire-and-forget event to a queue or exchange.
   */
  protected async dispatchEvent<T = unknown>(
    packet: ReadPacket<RabbitPayload>,
  ): Promise<T> {
    await this.rabbitClient.publish({
      content: this.rabbitClient.encode(packet.data.data),
      queue: packet.pattern,
      options: packet.data.options,
      exchange: packet.data.exchange,
    });
    return undefined as unknown as T;
  }

  /**
   * Returns the underlying RabbitClient instance.
   */
  public unwrap<T = RabbitClient>(): T {
    return this.rabbitClient as T;
  }
}
