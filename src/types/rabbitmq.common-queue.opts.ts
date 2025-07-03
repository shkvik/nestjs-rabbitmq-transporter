import { Options } from 'amqplib';

/**
 * Describes an exchange to bind a queue to.
 */
export type RabbitExchange = {
  /** Exchange name */
  name: string;

  /** Exchange type — e.g., 'fanout', 'direct', 'topic', etc. */
  type: 'direct' | 'topic' | 'headers' | 'fanout' | 'match';

  /** Optional assertion options for the exchange */
  options?: Options.AssertExchange;
};

/**
 * Shared base options for any queue-based strategy.
 */
export type CommonQueueOpts = {
  /** Queue name */
  name: string;

  /** List of exchanges to bind this queue to */
  exchanges?: RabbitExchange[];
};
