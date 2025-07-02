import { CommonQueueOpts } from './rabbitmq.common-queue.opts';

export type TernaryQueueOpts = {
  attempts?: number;
  ttl?: number;
} & CommonQueueOpts;
