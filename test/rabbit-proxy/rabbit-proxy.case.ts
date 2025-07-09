import { INestApplication } from '@nestjs/common';
import { RabbitClient } from 'src/rabbitmq.client';
import { RabbitProxy } from 'src/rabbitmq.proxy';

export class RabbitProxyCase {
  private readonly rabbitClient: RabbitClient;
  private readonly rabbitProxy: RabbitProxy;

  constructor(app: INestApplication) {
    this.rabbitProxy = app.get<RabbitProxy>('RabbitProxy');
    this.rabbitClient = this.rabbitProxy.unwrap<RabbitClient>();
  }

  public async connect() {}
  public async close() {}
  public async dispatch() {}
  public async dispatchConfirmed() {}
  public async dispatchMissingOpts() {}
}
