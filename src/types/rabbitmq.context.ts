import { Channel, ConsumeMessage } from 'amqplib';

export type RabbitContext = {
  msg: ConsumeMessage;
  channel: Channel;
};
