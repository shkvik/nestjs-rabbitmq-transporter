import { Controller } from '@nestjs/common';
import { Payload, RpcException } from '@nestjs/microservices';
import { TernaryQueue } from 'src/decorator';

@Controller()
export class ExampleController {
  @TernaryQueue({
    name: 'example',
    attempts: 10,
    exchanges: [
      {
        name: 'fanout.test',
        type: 'fanout',
        options: { durable: true },
      },
    ],
  })
  async handleQueue(@Payload() dto: unknown): Promise<void> {
    throw new RpcException('test error');
  }
}

@Controller()
export class ConcurentQueueController {
  @TernaryQueue({
    name: 'concurent-queue',
    attempts: 10,
    ttl: 1000,
    exchanges: [
      {
        name: 'fanout.test',
        type: 'fanout',
        options: { durable: true },
      },
    ],
  })
  async handleQueue(@Payload() dto: unknown): Promise<void> {
    throw new RpcException('test error');
  }
}
