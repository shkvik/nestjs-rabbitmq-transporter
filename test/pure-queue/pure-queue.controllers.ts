import { Controller, Injectable } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import { PureQueue } from 'src/decorator';
import {
  AUTO_ACK__DLX,
  AUTO_ACK__OFF,
  AUTO_ACK__REQUEUE,
  AUTO_ACK__SKIP,
  NO_ACK__DLX,
  NO_ACK__OFF,
  NO_ACK__REQUEUE,
  NO_ACK__SKIP,
} from './pure-queue.constant';

@Injectable()
export class PureQueueService {
  public handle(dto: unknown): void {
    console.log(dto);
  }
}

@Controller()
export class PureQueueController {
  constructor(private readonly pureQueueService: PureQueueService) {}

  @PureQueue(AUTO_ACK__REQUEUE)
  public autoAckRequeue(@Payload() dto: unknown): void {
    this.pureQueueService.handle(dto);
  }

  @PureQueue(AUTO_ACK__SKIP)
  public autoAckSkip(@Payload() dto: unknown): void {
    this.pureQueueService.handle(dto);
  }

  @PureQueue(AUTO_ACK__DLX)
  public autoAckDlx(@Payload() dto: unknown): void {
    this.pureQueueService.handle(dto);
  }

  @PureQueue(AUTO_ACK__OFF)
  public autoAckOff(@Payload() dto: unknown): void {
    this.pureQueueService.handle(dto);
  }

  @PureQueue(NO_ACK__REQUEUE)
  public noAckRequeue(@Payload() dto: unknown): void {
    this.pureQueueService.handle(dto);
  }

  @PureQueue(NO_ACK__SKIP)
  public noAckSkip(@Payload() dto: unknown): void {
    this.pureQueueService.handle(dto);
  }

  @PureQueue(NO_ACK__DLX)
  public noAckDlx(@Payload() dto: unknown): void {
    this.pureQueueService.handle(dto);
  }

  @PureQueue(NO_ACK__OFF)
  public noAckOff(@Payload() dto: unknown): void {
    this.pureQueueService.handle(dto);
  }
}
