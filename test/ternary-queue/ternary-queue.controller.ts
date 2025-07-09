import { Controller, Injectable } from '@nestjs/common';
import { Ctx, Payload, RpcException } from '@nestjs/microservices';
import { TernaryQueue } from 'src/decorator';
import { RabbitContext } from 'src/index';
import {
  TERNARY_QUEUE_ARCHIVE,
  TERNARY_QUEUE_DEFAULT,
  TERNARY_QUEUE_ERROR,
  TEST_ATTEMPT_COUNT,
} from './ternary-queue.constant';

@Injectable()
export class TernaryQueueService {
  public handle(dto: unknown): void {
    console.log(dto);
  }
}

@Controller()
export class TernaryQueueController {
  constructor(private readonly ternaryQueueService: TernaryQueueService) {}

  @TernaryQueue({ name: TERNARY_QUEUE_DEFAULT })
  public handleDefault(@Payload() dto: unknown): void {
    this.ternaryQueueService.handle(dto);
  }

  @TernaryQueue({
    name: TERNARY_QUEUE_ERROR,
    attempts: TEST_ATTEMPT_COUNT,
    ttl: 500,
  })
  public handleAttemptError(
    @Payload() dto: unknown,
    @Ctx() ctx: RabbitContext,
  ): void {
    const { msg } = ctx;
    const xDeath = msg?.properties?.headers['x-death'];

    if (xDeath && xDeath?.length && xDeath[0].count >= TEST_ATTEMPT_COUNT) {
      console.log(dto);
    }
    this.ternaryQueueService.handle(dto);
    throw new RpcException('attempt error');
  }

  @TernaryQueue({ name: TERNARY_QUEUE_ARCHIVE, ttl: 500 })
  public handleArchiveError(@Payload() dto: unknown): void {
    this.ternaryQueueService.handle(dto);
    throw new RpcException('archive error');
  }
}
