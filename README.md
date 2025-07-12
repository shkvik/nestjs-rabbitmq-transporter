# The [RabbitMQ](https://www.rabbitmq.com/) Transporter for [NestJS](https://nestjs.com/)

> [!IMPORTANT]
>
> This custom transporter was designed to provide a clean and convenient abstraction layer for RabbitMQ within NestJS, with full support for all core framework features such as interceptors, filters, guards, and dynamic context resolution. It aims to offer a seamless developer experience while elegantly encapsulating well-established messaging patterns (like main–retry–archive queues, acknowledgements, and error handling strategies) behind a declarative and idiomatic NestJS interface.

## Overview
It is built on top of the low-level amqplib library, giving you fine-grained control over AMQP protocol features while staying fully aligned with NestJS design principles.

Beginning to work with the library, I recommend reviewing the documentation and understanding how it works, so you won't encounter any surprises during usage. I aimed to create the simplest possible interface with reliable logic, which is why I wrote tests for every configuration option — so both you and I can sleep better at night.

## Installation

To start using the custom RabbitMQ transporter in a NestJS project, you need to install the core package along with its required peer dependencies.

```bash
npm i --save nodejs-rabbitmq-transporter amqplib @nestjs/microservices
```

## Getting started
Replace the default Transport.TCP with RabbitTransporter to use RabbitMQ as your transport layer. The custom RabbitMQ transporter uses the same connection parameters as [`amqplib`](https://www.npmjs.com/package/amqplib). You can pass them directly to the `RabbitTransporter` constructor.
```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RabbitTransporter } from 'nodejs-rabbitmq-transporter';
import { MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      strategy: new RabbitTransporter({
        protocol: 'amqp',
        hostname: 'localhost',
        port: 5672,
        username: 'admin',
        password: 'admin',
        heartbeat: 30,
      }),
    },
  );
  await app.listen();
}
bootstrap();
```
### Available Options

| Option       | Type     | Default     | Description |
|--------------|----------|-------------|-------------|
| `protocol`   | `string` | `'amqp'`    | Protocol used to connect to RabbitMQ. Usually `'amqp'` or `'amqps'`. |
| `hostname`   | `string` | `'localhost'` | The hostname of the RabbitMQ server. |
| `port`       | `number` | `5672`      | The port used for the connection. Defaults to the standard AMQP port. |
| `username`   | `string` | `'guest'`   | Username for authentication. |
| `password`   | `string` | `'guest'`   | Password for authentication. |
| `locale`     | `string` | `'en_US'`   | Error message language. RabbitMQ only uses `'en_US'`. |
| `frameMax`   | `number` | `4096` (`0x1000`) | Maximum frame size in bytes. Use `0` for no limit (up to 2^32 - 1). |
| `heartbeat`  | `number` | `0`         | Heartbeat interval in seconds. Use `0` to disable. |
| `vhost`      | `string` | `'/'`       | The virtual host to use. |

> 💡 These are the same options accepted by `amqplib.connect()`, giving you full control over the underlying AMQP connection.

## Message and Event Patterns
This transporter does not support the Request/Response communication pattern @MessagePattern() with .send(), because the author believes it violates core messaging principles.

Instead, the transporter is built around fire-and-forget event-based communication, with a focus on delivery guarantees 

## Pure Queue
Pure Queue is the most basic queue handler provided by the transporter. It connects directly to a queue with minimal abstraction and gives you full control over how message acknowledgment is handled.

If the handler method completes successfully — meaning it does not throw an error or return a rejected promise — the message is automatically acknowledged (ack). If an error is thrown during execution, the message is rejected (nack) and, if a dead-letter exchange (DLX) is configured, it will be forwarded there.
```ts
import { Controller } from '@nestjs/common';
import { PureQueue, Payload } from 'nodejs-rabbitmq-transporter';

@Controller()
export class MathController {
  @PureQueue({ name: 'sum' })
  accumulate(@Payload() data: number[]): void {
    console.log((data || []).reduce((a, b) => a + b));
  }
}

```
It’s important to note that @PureQueue() does not automatically create dead-letter or retry queues. You need to configure these manually, and the documentation below explains how to do that.


