import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { RabbitTransporter } from 'src/rabbitmq.transporter';
import { ExampleModule } from './example/example.module';

export class AppBuilder {
  private app: INestApplication<unknown>;

  public async create(): Promise<INestApplication<unknown>> {
    const moduleRef = await Test.createTestingModule({
      imports: [ExampleModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    app.connectMicroservice({
      strategy: new RabbitTransporter({
        protocol: 'amqp',
        port: 5672,
        hostname: 'localhost',
        username: 'admin',
        password: 'admin',
        heartbeat: 30,
      }),
    });
    await app.startAllMicroservices();
    this.app = app;
    return app.init();
  }

  public async dispose(): Promise<void> {
    await this.app.close();
  }
}
