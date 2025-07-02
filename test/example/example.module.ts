import { Module } from '@nestjs/common';
import {
  ConcurentQueueController,
  ExampleController,
} from './example.controller';
import { ClientsModule } from '@nestjs/microservices';
import { RabbitProxy } from 'src/rabbitmq.proxy';

@Module({
  imports: [
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
  controllers: [ExampleController, ConcurentQueueController],
})
export class ExampleModule {}
