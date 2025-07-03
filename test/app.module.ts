import { Module } from '@nestjs/common';
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
})
export class AppModule {}
