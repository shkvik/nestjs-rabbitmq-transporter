import { Module } from '@nestjs/common';
import {
  PureQueueService,
  PureQueueController,
} from './pure-queue.controllers';

@Module({
  controllers: [PureQueueController],
  providers: [PureQueueService],
})
export class PureQueueModule {}
