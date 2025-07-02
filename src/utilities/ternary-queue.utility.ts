import { Channel } from 'amqplib';

export const createMainQueue = async (
  queue: string,
  channel: Channel,
): Promise<void> => {
  await channel.assertExchange(`${queue}.main.exchange`, 'direct', {
    durable: true,
  });
  await channel.assertQueue(`${queue}.main.queue`, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': `${queue}.retry.exchange`,
      'x-dead-letter-routing-key': `${queue}.retry.key`,
    },
  });
  await channel.bindQueue(
    `${queue}.main.queue`,
    `${queue}.main.exchange`,
    `${queue}.main.key`,
  );
};

export const createArchiveQueue = async (
  queue: string,
  channel: Channel,
): Promise<void> => {
  await channel.assertQueue(`${queue}.archive.queue`, {
    durable: true,
  });
};

export const createRetryQueue = async (
  queue: string,
  channel: Channel,
  ttl: number,
): Promise<void> => {
  await channel.assertExchange(`${queue}.retry.exchange`, 'direct', {
    durable: true,
  });
  await channel.assertQueue(`${queue}.retry.queue`, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': `${queue}.main.exchange`,
      'x-dead-letter-routing-key': `${queue}.main.key`,
      'x-message-ttl': ttl,
    },
  });
  await channel.bindQueue(
    `${queue}.retry.queue`,
    `${queue}.retry.exchange`,
    `${queue}.retry.key`,
  );
};
