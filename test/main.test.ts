import { INestApplication } from '@nestjs/common';
import { AppBuilder } from './app.builder';
import { RabbitProxy } from 'src/rabbitmq.proxy';
import { RabbitPayload } from 'src/types/rabbitmq.payload';
import { randomUUID } from 'node:crypto';

describe('NestJs RabbitMQ Transporter Test', function () {
  let builder: AppBuilder;
  let proxy: RabbitProxy;
  let app: INestApplication;

  beforeAll(async () => {
    builder = new AppBuilder();
    app = await builder.create();
    proxy = app.get<RabbitProxy>('RabbitProxy');
  });
  afterAll(async () => {
    await builder.dispose();
  });

  it('example', async () => {
    proxy.emit<void, RabbitPayload<any>>('', {
      exchange: 'fanout.test',
      options: {
        messageId: randomUUID(),
      },
      data: {
        msg: 'test',
      },
    });
    await new Promise((res) => setTimeout(res, 1000000));
  });
});
