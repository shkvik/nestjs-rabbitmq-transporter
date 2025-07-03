import { Channel } from 'amqplib';

/**
 * Creates the main queue and its associated exchange.
 * Configures dead-lettering to the retry exchange on failure.
 *
 * @param queue - Base name for the queue and exchange (used as a prefix).
 * @param channel - AMQP channel used to declare queue and exchange.
 */
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

/**
 * Creates the archive (dead-letter) queue for messages that exceed max retries.
 *
 * @param queue - Base name for the archive queue (used as a prefix).
 * @param channel - AMQP channel used to declare the queue.
 */
export const createArchiveQueue = async (
  queue: string,
  channel: Channel,
): Promise<void> => {
  await channel.assertQueue(`${queue}.archive.queue`, {
    durable: true,
  });
};

/**
 * Creates the retry queue and its associated exchange.
 * Messages are delayed using TTL and redirected back to the main queue.
 *
 * @param queue - Base name for the retry queue and exchange (used as a prefix).
 * @param channel - AMQP channel used to declare queue and exchange.
 * @param ttl - Time-to-live in milliseconds before retrying a message.
 */
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
