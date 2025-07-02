import { Options } from 'amqplib';

export type RabbitExchange = {
  name: string;
  type: 'direct' | 'topic' | 'headers' | 'fanout' | 'match';
  options?: Options.AssertExchange;
};

export type CommonQueueOpts = {
  name: string;
  exchanges?: RabbitExchange[];
};
