import { RabbitClient } from 'src/rabbitmq.client';

export const waitConsumeQueue = async (client: RabbitClient, queue: string) => {
  const channel = client.getChannel();
  await delay(2000);
  let info = await channel.checkQueue(queue);

  while (info.messageCount > 0) {
    await delay(2000);
    info = await channel.checkQueue(queue);
  }
};

export const waitConsumeTernaryQueue = async (
  client: RabbitClient,
  mainQ: string,
  retryQ: string,
) => {
  const channel = client.getChannel();
  await delay(2000);
  let mainQInfo = await channel.checkQueue(mainQ);
  let retryQInfo = await channel.checkQueue(retryQ);

  while (mainQInfo.messageCount > 0 || retryQInfo.messageCount > 0) {
    await delay(2000);
    mainQInfo = await channel.checkQueue(mainQ);
    retryQInfo = await channel.checkQueue(retryQ);
  }
};

export const delay = async (ms: number): Promise<void> => {
  await new Promise((res) => setTimeout(res, ms));
};
