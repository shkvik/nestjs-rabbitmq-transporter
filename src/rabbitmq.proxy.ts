import { ClientProxy, ReadPacket, WritePacket } from '@nestjs/microservices';
import { Injectable, Logger } from '@nestjs/common';
import { Options } from 'amqplib';
import { RabbitPayload } from './types/rabbitmq.payload';
import { RabbitClient, RabbitClientInstance } from './rabbitmq.client';
import { ReadPacket2 } from './types';

@Injectable()
export class RabbitProxy extends ClientProxy {
  private readonly logger = new Logger(RabbitProxy.name);

  private readonly rabbitClient: RabbitClient;

  constructor(private readonly connectionOpts: Options.Connect) {
    super();
    this.rabbitClient = RabbitClientInstance;
  }

  public async connect(): Promise<void> {
    await this.rabbitClient.connect(this.connectionOpts);
  }

  public async close(): Promise<any> {
    await this.rabbitClient.close();
  }

  protected publish(
    _: ReadPacket,
    __: (packet: WritePacket) => void,
  ): () => void {
    this.logger.warn(
      'RabbitProxy.publish() (RPC) called; implement custom logic if needed.',
    );
    return () => {};
  }

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

  public unwrap<T = RabbitClient>(): T {
    return this.rabbitClient as T;
  }
}
