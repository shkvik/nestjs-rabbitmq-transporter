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

The @PureQueue() decorator accepts an options object that allows you to fine-tune both how the queue is declared and how messages are consumed and acknowledged.

You can pass queueOpts, which corresponds to the standard amqplib queue assertion options. This lets you control things like durability, exclusivity, auto-deletion, and dead-letter settings when the queue is created.

For consumer behavior, you can use the consumeOpts field. This includes ackPolicy and nackPolicy, which define how the transporter should react when a message is successfully handled or fails during processing. By default, ackPolicy is set to AUTO, meaning the message will be automatically acknowledged after successful execution. If you want to take full control, you can set it to OFF, and handle acknowledgments manually inside your handler.

For failed messages, the nackPolicy determines what happens when an exception is thrown. The default is DLX, which sends the message to a configured dead-letter exchange. You can change this to REQUEUE to immediately try again, SKIP to drop the message silently, or OFF to handle the nack logic yourself.

All other standard amqplib consumer options (such as noAck, exclusive, priority, etc.) can also be included under consumeOpts, and will be passed directly to channel.consume.

### `PureQueue` Options

| Field          | Type                      | Description |
|----------------|---------------------------|-------------|
| `name`         | `string`                  | The name of the queue to consume. Required. |
| `queueOpts`    | `Options.AssertQueue`     | AMQP queue settings passed to `channel.assertQueue`. Used to configure durability, DLX, etc. |
| `consumeOpts`  | `ConsumeOpts`             | Settings related to how the queue is consumed (ack/nack policies, AMQP consumer options). |

### `consumeOpts` Details

| Field         | Type            | Default | Description |
|---------------|-----------------|---------|-------------|
| `ackPolicy`   | `AckPolicy`     | `AUTO`  | Defines how to acknowledge successful messages. Use `AUTO` to auto-ack, or `OFF` to handle manually. |
| `nackPolicy`  | `NackPolicy`    | `DLX`   | Defines how to reject failed messages. Options: `DLX`, `REQUEUE`, `SKIP`, or `OFF`. |
| *(...)*       | `Options.Consume` | —     | You can also pass any standard AMQP consume options like `noAck`, `exclusive`, `priority`, etc. |

### AckPolicy Enum

| Value   | Description |
|---------|-------------|
| `AUTO`  | Automatically acknowledge the message after successful processing. |
| `OFF`   | Disable automatic `ack`. You must call `msg.ack()` manually. |

### NackPolicy Enum

| Value    | Description |
|----------|-------------|
| `DLX`    | Send failed messages to the dead-letter exchange. |
| `REQUEUE`| Requeue the message immediately for retry. |
| `SKIP`   | Drop the message silently without retry or DLX. |
| `OFF`    | Do not perform any `nack`. You must handle it manually. |

## Ternary Queue
TernaryQueue is a higher-level queue pattern that extends the basic message consumption flow with built-in support for retries and dead-lettering. When you use this decorator, it automatically sets up a complete three-phase processing pipeline consisting of main, retry, and archive queues, along with two associated exchanges.

The idea is simple: when a message is consumed from the main queue and the handler succeeds, the message is acknowledged (ack) and processing ends. If an error occurs, the transporter does not drop the message immediately. Instead, it follows a structured failure flow.

On failure, the message is re-published to the retry exchange, which sends it into a retry queue with a delay (using x-message-ttl). After that delay expires, the message is routed back to the main queue for another attempt. If the message fails repeatedly beyond a configured threshold (e.g. via x-death header count), it is finally sent to an archive queue for inspection or manual recovery.

This pattern ensures at-least-once delivery semantics and makes your system resilient to transient errors, without introducing infinite retry loops or silent drops.
```ts
@Controller()
export class MathController {
  @TernaryQueue({ name: 'example' })
  accumulate(@Payload() data: number[]): void {
    console.log((data || []).reduce((a, b) => a + b));
  }
}
```
### `TernaryQueue` Options

| Field      | Type              | Default | Description                                                                                                        |
| ---------- | ----------------- | ------- | ------------------------------------------------------------------------------------------------------------------ |
| `name`     | `string`          | —       | The base name for the queue group. Required. All queues and exchanges will be derived from this.                   |
| `attempts` | `number`          | `3`     | The maximum number of retry attempts before the message is moved to the archive queue.                             |
| `ttl`      | `number`          | `5000`  | The delay in milliseconds before a failed message is retried. This becomes the `x-message-ttl` of the retry queue. |

When you declare TernaryQueue, the following infrastructure is created automatically:

Queues:
1. example.main.queue – the primary working queue
2. example.retry.queue – holds failed messages temporarily for retry after delay
3. example.archive.queue – stores permanently failed messages for inspection

Exchanges:
1. example.main.exchange – main direct exchange used for normal routing
2. example.retry.exchange – dead-letter exchange that routes messages to retry

This setup requires no manual configuration. All bindings, dead-letter settings, and TTLs are handled internally by the transporter.

Under the hood, the queue declarations use x-dead-letter-exchange, x-dead-letter-routing-key, and x-message-ttl to define message flows. The retry logic is deterministic, and messages maintain metadata (such as x-death headers) across hops, allowing you to build advanced retry policies if needed.

> [!Important]
> When using `@TernaryQueue`, **you must send messages directly to the `.main.queue`**, not the base queue name.
>
> For example, if you register a ternary queue with the name `example`, then you **must publish messages to `example.main.queue`**, not just `example`.
> Failing to do so will result in the message being dropped or unroutable, since only the `example.main.queue` is actively consumed by your handler.


## Additional request details

All consumers decorators fully support the `NestJS` execution context, just like standard `REST` or `GraphQL` handlers. This means you can inject and use the full power of NestJS features inside your queue handler methods.
You can access the incoming message payload using the `@Payload()` decorator. Additionally, if you need to inspect the raw AMQP context (such as headers, delivery info, redelivery flags, etc.), you can inject it via `@Ctx()`.

All standard NestJS features are supported out of the box, including:
- Validation pipes: You can apply class-validator rules to incoming payloads, just like in REST controllers.
- Exception filters: If your handler throws an error, it will go through the configured `@Catch()` filters.
- Guards: You can apply `@UseGuards()` to protect handlers conditionally.
- Interceptors: `@UseInterceptors()` can be used for logging, tracing, or transforming results.
- Dependency injection: Services, repositories, and other providers work as expected.

In short, the transporter integrates tightly with the NestJS lifecycle, so you can reuse your architecture, logic, and decorators without compromise — even in a message-driven context.

## Client (producer class)

The library also provides a **RabbitMQ proxy client**, fully compatible with NestJS’s dependency injection system and designed to feel native within the framework. You can inject this proxy anywhere in your services or resolvers to emit messages or trigger downstream events.

Unlike NestJS's built-in `ClientProxy`, this proxy does **not support request/response messaging** (i.e., `.send()`), by design — as this pattern is intentionally excluded for architectural reasons. Instead, the proxy focuses on **fire-and-forget**, **at-least-once** messaging with advanced delivery guarantees.

In addition to basic publishing, the proxy also supports:

* **Confirmed delivery** via `waitForConfirms()`, ensuring the broker acknowledges message receipt
* **Metadata headers**, which you can attach and consume later in downstream services
* **Custom exchange/routingKey configuration**, to route events with precision

```ts
// app.module.ts
import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { RabbitProxy } from 'nodejs-rabbitmq-transporter'; // your custom proxy
import { AppService } from './app.service';

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
  providers: [AppService],
})
export class AppModule {}
```

The `RabbitProxy` supports message publishing to **custom exchanges** of any standard AMQP type, including `'direct'`, `'topic'`, `'fanout'`, `'headers'`, and `'match'` (if enabled in your broker). You can specify the exchange name in the `RabbitPayload` object using the `exchange` field.

When publishing to an exchange, the `routingKey` (passed as the first argument to `emit()`) will be used for message routing, depending on the exchange type.

Additionally, if you set the `confirmation` flag to `true`, the transporter will wait for **broker-level confirmation** (using `waitForConfirms()`) before resolving the promise. This gives you delivery guarantees similar to `at-least-once`, ensuring the broker has accepted the message.

This makes `RabbitProxy.emit()` suitable for both high-speed fire-and-forget use cases and critical message flows that require strong delivery guarantees.

```ts
// basic example
import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { RabbitProxyInstance, RabbitPayload } from 'nodejs-rabbitmq-transporter';

@Injectable()
export class NotificationService {
  constructor(
    @Inject('RabbitProxy')
    private readonly rabbitProxy: RabbitProxyInstance,
  ) {}

  sendDirectToQueue() {
    const payload = {
      message: 'Direct message to queue',
    };

    this.rabbitProxy.emit<void, RabbitPayload<typeof payload>>('my.queue.name', {
      data: payload,
    });
  }
}

```
### `RabbitPayload<Data>` Parameters

| Field          | Type              | Required | Default | Description                                                                                                                                 |
| -------------- | ----------------- | -------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `data`         | `Data`            | Yes      | –       | The actual message payload. It will be serialized before publishing.                                                                        |
| `exchange`     | `string`          | No       | `''`    | Name of the exchange to publish the message to. If omitted, the default exchange is used (which sends directly to a queue by `routingKey`). |
| `options`      | `Options.Publish` | No       | –       | Optional AMQP publish options, such as `headers`, `persistent`, `priority`, etc. Passed directly to `channel.publish()`.                    |
| `confirmation` | `boolean`         | No       | `false` | If `true`, the method waits for broker-level confirmation using `waitForConfirms()`. Recommended for critical or guaranteed delivery.       |

