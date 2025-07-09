import { Module } from '@nestjs/common';
import {
  TernaryQueueController,
  TernaryQueueService,
} from './ternary-queue.controller';

@Module({
  controllers: [TernaryQueueController],
  providers: [TernaryQueueService],
})
export class TernaryQueueModule {}
