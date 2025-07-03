import { Module } from '@nestjs/common';
import {
  ConcurentQueueController,
  ExampleController,
} from './fan-out.controllers';

@Module({
  controllers: [ExampleController, ConcurentQueueController],
})
export class ExampleModule {}
