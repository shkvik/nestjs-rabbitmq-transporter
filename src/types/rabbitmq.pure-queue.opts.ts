import { Options } from 'amqplib';
import { CommonQueueOpts } from './rabbitmq.common-queue.opts';

export enum NackPolicy {
  REQUEUE,
  SKIP,
  DLX,
  OFF,
}

export enum AckPolicy {
  AUTO,
  OFF,
}

export type ConsumeOpts = {
  ackPolicy?: AckPolicy;
  nackPolicy?: NackPolicy;
} & Options.Consume;

export type PureQueueOpts = {
  queueOpts?: Options.AssertQueue;
  consumeOpts?: ConsumeOpts;
} & CommonQueueOpts;
