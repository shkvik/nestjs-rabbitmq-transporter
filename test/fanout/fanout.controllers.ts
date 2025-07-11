import { Controller, Injectable, Logger } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import { PureQueue, TernaryQueue } from 'src/decorator';
import { NackPolicy } from 'src/types';
import { TestUniqePayload } from 'test/utilities/payload-helpers';
import {
  FANOUT_TEST_RABBIT_EXCHANGE,
  TEST_AT_LEAST_ONCE_Q_FANOUT,
  TEST_AT_MOST_ONCE_Q_FANOUT,
  TEST_TERNARY_Q_1_FANOUT,
  TEST_TERNARY_Q_2_FANOUT,
} from './fanout.constant';

@Injectable()
export class FanoutService {
  private readonly logger: Logger;

  constructor() {
    this.logger = new Logger(FanoutService.name);
  }

  public handleTernary1(dto: TestUniqePayload): void {
    this.logger.log(`handleTernary1 msg: ${dto.msgId}`);
  }

  public handleTernary2(dto: TestUniqePayload): void {
    this.logger.log(`handleTernary2 msg: ${dto.msgId}`);
  }

  public handlePureAtMostOnce(dto: TestUniqePayload): void {
    this.logger.log(`handlePureAtMostOnce msg: ${dto.msgId}`);
  }

  public handlePureAtLeastOnce(dto: TestUniqePayload): void {
    this.logger.log(`handlePureAtLeastOnce msg: ${dto.msgId}`);
  }
}

@Controller()
export class FanoutController {
  constructor(private readonly fanoutService: FanoutService) {}
  @TernaryQueue({
    name: TEST_TERNARY_Q_1_FANOUT,
    ttl: 500,
    exchanges: [FANOUT_TEST_RABBIT_EXCHANGE],
  })
  public handleTernary1(@Payload() dto: TestUniqePayload): void {
    this.fanoutService.handleTernary1(dto);
  }

  @TernaryQueue({
    name: TEST_TERNARY_Q_2_FANOUT,
    ttl: 500,
    exchanges: [FANOUT_TEST_RABBIT_EXCHANGE],
  })
  public handleTernary2(@Payload() dto: TestUniqePayload): void {
    this.fanoutService.handleTernary2(dto);
  }

  @PureQueue({
    name: TEST_AT_MOST_ONCE_Q_FANOUT,
    consumeOpts: { nackPolicy: NackPolicy.SKIP },
    queueOpts: {
      durable: true,
    },
    exchanges: [FANOUT_TEST_RABBIT_EXCHANGE],
  })
  public handlePureAtMostOnce(@Payload() dto: TestUniqePayload) {
    this.fanoutService.handlePureAtMostOnce(dto);
  }

  @PureQueue({
    name: TEST_AT_LEAST_ONCE_Q_FANOUT,
    consumeOpts: { nackPolicy: NackPolicy.REQUEUE },
    queueOpts: {
      durable: true,
    },
    exchanges: [FANOUT_TEST_RABBIT_EXCHANGE],
  })
  public handlePureAtLeastOnce(@Payload() dto: TestUniqePayload) {
    this.fanoutService.handlePureAtLeastOnce(dto);
  }
}
