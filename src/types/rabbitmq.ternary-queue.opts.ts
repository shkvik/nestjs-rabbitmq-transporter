import { CommonQueueOpts } from './rabbitmq.common-queue.opts';

/**
 * Options for setting up a ternary queue pattern:
 * main queue → retry queue → archive queue.
 */
export type TernaryQueueOpts = {
  /** Maximum number of retry attempts before archiving (default: 3) */
  attempts?: number;

  /** Delay (in milliseconds) before retrying a failed message (default: 5000) */
  ttl?: number;
} & CommonQueueOpts;
