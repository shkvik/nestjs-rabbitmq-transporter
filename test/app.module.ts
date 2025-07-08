import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { RabbitProxy } from 'src/rabbitmq.proxy';
import { ExampleModule } from './fan-out/fan-out.module';
import { TernaryQueueModule } from './ternary-queue/ternary-queue.module';

@Module({
  imports: [
    TernaryQueueModule,
    ExampleModule,
    ClientsModule.register([
      {
        name: 'RabbitProxy',
        customClass: RabbitProxy,
        options: {
          protocol: 'amqp',
          port: 5672,
          hostname: 'localhost',
          username: 'admin',
          password: 'admin',
          heartbeat: 30,
        },
      },
    ]),
  ],
})
export class AppModule {}
