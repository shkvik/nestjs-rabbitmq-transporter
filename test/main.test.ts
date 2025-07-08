import { INestApplication } from '@nestjs/common';
import { AppBuilder } from './app.builder';
import { RabbitProxy } from 'src/rabbitmq.proxy';
import { RabbitPayload } from 'src/types/rabbitmq.payload';
import { randomUUID } from 'node:crypto';
import { TernaryQueueService } from './ternary-queue/ternary-queue.controllers';
import { RabbitClient } from 'src/rabbitmq.client';
import {
  TERNARY_QUEUE_ARCHIVE,
  TERNARY_QUEUE_DEFAULT,
  TERNARY_QUEUE_ERROR,
  TEST_ATTEMPT_COUNT,
} from './ternary-queue/ternary-queue.contant';

describe('NestJs RabbitMQ Transporter Tests', function () {
  let builder: AppBuilder;
  let client: RabbitClient;
  let proxy: RabbitProxy;
  let app: INestApplication;

  let waitConsumeQueue: (queue: string) => Promise<void>;
  let waitConsumeTernaryQueue: (mainQ: string, retryQ: string) => Promise<void>;

  beforeAll(async () => {
    builder = new AppBuilder();
    app = await builder.create();
    proxy = app.get<RabbitProxy>('RabbitProxy');
    client = proxy.unwrap<RabbitClient>();

    waitConsumeQueue = async (queue: string) => {
      await new Promise((res) => setTimeout(res, 2000));
      let info = await client.getChannel().checkQueue(queue);

      while (info.messageCount > 0) {
        await new Promise((res) => setTimeout(res, 2000));
        info = await client.getChannel().checkQueue(queue);
      }
    };
    waitConsumeTernaryQueue = async (mainQ: string, retryQ: string) => {
      await new Promise((res) => setTimeout(res, 2000));
      let mainQInfo = await client.getChannel().checkQueue(mainQ);
      let retryQInfo = await client.getChannel().checkQueue(retryQ);

      while (mainQInfo.messageCount > 0 || retryQInfo.messageCount > 0) {
        await new Promise((res) => setTimeout(res, 2000));
        mainQInfo = await client.getChannel().checkQueue(mainQ);
        retryQInfo = await client.getChannel().checkQueue(retryQ);
      }
    };
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(async () => {
    await builder.dispose();
  });
  describe('TernaryQueue', () => {
    it('When all right', async () => {
      const service = app.get(TernaryQueueService);
      const serviceSpy = jest.spyOn(service, 'handle');
      const queue = `${TERNARY_QUEUE_DEFAULT}.main.queue`;
      const testPayload = {
        msgId: randomUUID(),
        data: 'all right test',
      };
      await client.getChannel().purgeQueue(queue);
      proxy.emit<void, RabbitPayload<any>>(queue, {
        data: testPayload,
      });
      await waitConsumeQueue(queue);
      expect(serviceSpy).toHaveBeenCalledWith(testPayload);
    });
    it('When errors with attempts', async () => {
      const service = app.get(TernaryQueueService);
      const serviceSpy = jest.spyOn(service, 'handle');

      const mainQ = `${TERNARY_QUEUE_ERROR}.main.queue`;
      const retryQ = `${TERNARY_QUEUE_ERROR}.retry.queue`;
      const archiveQ = `${TERNARY_QUEUE_ERROR}.archive.queue`;

      const testPayload = {
        msgId: randomUUID(),
        data: 'errors with attempts test',
      };
      await client.getChannel().purgeQueue(mainQ);
      await client.getChannel().purgeQueue(retryQ);
      await client.getChannel().purgeQueue(archiveQ);

      proxy.emit<void, RabbitPayload<any>>(mainQ, {
        data: testPayload,
      });
      await waitConsumeTernaryQueue(mainQ, retryQ);
      expect(serviceSpy).toHaveBeenCalledTimes(TEST_ATTEMPT_COUNT);
    });
    it('When archive queue', async () => {
      const service = app.get(TernaryQueueService);
      const serviceSpy = jest.spyOn(service, 'handle');

      const mainQ = `${TERNARY_QUEUE_ARCHIVE}.main.queue`;
      const retryQ = `${TERNARY_QUEUE_ARCHIVE}.retry.queue`;
      const archiveQ = `${TERNARY_QUEUE_ARCHIVE}.archive.queue`;

      const testPayload = {
        msgId: randomUUID(),
        data: 'errors with attempts test',
      };
      await client.getChannel().purgeQueue(mainQ);
      await client.getChannel().purgeQueue(retryQ);
      await client.getChannel().purgeQueue(archiveQ);

      proxy.emit<void, RabbitPayload<any>>(mainQ, {
        data: testPayload,
      });
      await waitConsumeTernaryQueue(mainQ, retryQ);

      const mainQInfo = await client.getChannel().checkQueue(mainQ);
      const retryQInfo = await client.getChannel().checkQueue(retryQ);
      const archiveQInfo = await client.getChannel().checkQueue(archiveQ);

      expect(mainQInfo.messageCount).toEqual(0);
      expect(retryQInfo.messageCount).toEqual(0);
      expect(archiveQInfo.messageCount).toEqual(1);

      expect(serviceSpy).toHaveBeenCalledTimes(3);
    });
  });
});
