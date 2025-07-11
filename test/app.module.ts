import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { RabbitProxy } from 'src/rabbitmq.proxy';
import { TernaryQueueModule } from './ternary-queue/ternary-queue.module';
import { PureQueueModule } from './pure-queue/pure-queue.module';
import { FanoutModule } from './fanout/fanout.module';

@Module({
  imports: [
    TernaryQueueModule,
    PureQueueModule,
    FanoutModule,
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
