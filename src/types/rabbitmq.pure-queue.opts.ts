import { Options } from 'amqplib';
import { CommonQueueOpts } from './rabbitmq.common-queue.opts';

/**
 * Policy for how to negatively acknowledge (nack) failed messages.
 */
export enum NackPolicy {
  /** Requeue the message for retry */
  REQUEUE,

  /** Skip the message without requeueing or DLX */
  SKIP,

  /** Reject the message and send it to the Dead Letter Exchange (DLX) */
  DLX,

  /** Do not nack at all (caller handles manually) */
  OFF,
}

/**
 * Policy for how to acknowledge (ack) successfully processed messages.
 */
export enum AckPolicy {
  /** Automatically acknowledge after successful processing */
  AUTO,

  /** Do not ack (manual handling) */
  OFF,
}

/**
 * Options for consuming a queue, including ack/nack strategies and AMQP options.
 */
export type ConsumeOpts = {
  /** Ack behavior for successful messages (default: AUTO) */
  ackPolicy?: AckPolicy;

  /** Nack behavior for failed messages (default: DLX) */
  nackPolicy?: NackPolicy;
} & Options.Consume;

/**
 * Options for setting up a basic queue with optional consumer behavior.
 */
export type PureQueueOpts = {
  /** AMQP options for queue assertion */
  queueOpts?: Options.AssertQueue;

  /** Consumer behavior and ack/nack policies */
  consumeOpts?: ConsumeOpts;
} & CommonQueueOpts;
