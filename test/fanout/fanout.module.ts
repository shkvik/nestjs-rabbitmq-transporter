import { Module } from '@nestjs/common';
import { FanoutController, FanoutService } from './fanout.controllers';

@Module({
  providers: [FanoutService],
  controllers: [FanoutController],
})
export class FanoutModule {}
