import { Module } from '@nestjs/common';
import {
  TernaryQueueDefaultController,
  TernaryQueueAttemptController,
  TernaryQueueService,
  TernaryQueueArchiveController,
} from './ternary-queue.controllers';

@Module({
  controllers: [
    TernaryQueueDefaultController,
    TernaryQueueAttemptController,
    TernaryQueueArchiveController,
  ],
  providers: [TernaryQueueService],
})
export class TernaryQueueModule {}
