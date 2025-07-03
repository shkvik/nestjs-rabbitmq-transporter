import { Channel, ConsumeMessage } from 'amqplib';

/**
 * Runtime context passed to a message handler.
 * Contains both the raw message and the channel instance.
 */
export type RabbitContext = {
  /** The raw RabbitMQ message being consumed */
  msg: ConsumeMessage;

  /** The channel through which the message was received */
  channel: Channel;
};
