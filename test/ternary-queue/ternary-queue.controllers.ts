import { Controller, Injectable } from '@nestjs/common';
import { Ctx, Payload, RpcException } from '@nestjs/microservices';
import { TernaryQueue } from 'src/decorator';
import { RabbitContext } from 'src/index';
import {
  TERNARY_QUEUE_ARCHIVE,
  TERNARY_QUEUE_DEFAULT,
  TERNARY_QUEUE_ERROR,
  TEST_ATTEMPT_COUNT,
} from './ternary-queue.contant';

@Injectable()
export class TernaryQueueService {
  public handle(dto: unknown): void {
    console.log(dto);
  }
}

@Controller()
export class TernaryQueueDefaultController {
  constructor(private readonly ternaryQueueService: TernaryQueueService) {}

  @TernaryQueue({ name: TERNARY_QUEUE_DEFAULT })
  public handleQueue(@Payload() dto: unknown): void {
    this.ternaryQueueService.handle(dto);
  }
}

@Controller()
export class TernaryQueueAttemptController {
  constructor(private readonly ternaryQueueService: TernaryQueueService) {}

  @TernaryQueue({
    name: TERNARY_QUEUE_ERROR,
    attempts: TEST_ATTEMPT_COUNT,
    ttl: 500,
  })
  handleQueue(@Payload() dto: unknown, @Ctx() ctx: RabbitContext): void {
    const { msg } = ctx;
    const xDeath = msg?.properties?.headers['x-death'];

    if (xDeath && xDeath?.length && xDeath[0].count >= TEST_ATTEMPT_COUNT) {
      console.log(dto);
    }
    this.ternaryQueueService.handle(dto);
    throw new RpcException('attempt error');
  }
}

@Controller()
export class TernaryQueueArchiveController {
  constructor(private readonly ternaryQueueService: TernaryQueueService) {}

  @TernaryQueue({ name: TERNARY_QUEUE_ARCHIVE, ttl: 500 })
  handleQueue(@Payload() dto: unknown): void {
    this.ternaryQueueService.handle(dto);
    throw new RpcException('archive error');
  }
}
