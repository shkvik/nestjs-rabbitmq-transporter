import { INestApplication } from '@nestjs/common';
import { TernaryQueueService } from './ternary-queue.controllers';
import {
  TERNARY_QUEUE_ARCHIVE,
  TERNARY_QUEUE_DEFAULT,
  TERNARY_QUEUE_ERROR,
  TEST_ATTEMPT_COUNT,
} from './ternary-queue.contant';
import { randomUUID } from 'node:crypto';
import { RabbitClient } from 'src/rabbitmq.client';
import { RabbitProxy } from 'src/rabbitmq.proxy';
import { RabbitPayload } from 'src/types';
import {
  waitConsumeQueue,
  waitConsumeTernaryQueue,
} from '../utilities/wait-consume';

export class TernaryQueueCase {
  private readonly ternaryQueueService: TernaryQueueService;
  private readonly rabbitClient: RabbitClient;
  private readonly rabbitProxy: RabbitProxy;

  constructor(app: INestApplication) {
    this.ternaryQueueService = app.get(TernaryQueueService);
    this.rabbitProxy = app.get<RabbitProxy>('RabbitProxy');
    this.rabbitClient = this.rabbitProxy.unwrap<RabbitClient>();
  }

  public async whenAllRight(): Promise<void> {
    const serviceSpy = jest.spyOn(this.ternaryQueueService, 'handle');
    const queue = `${TERNARY_QUEUE_DEFAULT}.main.queue`;
    const testPayload = {
      msgId: randomUUID(),
      data: 'all right test',
    };
    await this.rabbitClient.getChannel().purgeQueue(queue);
    this.rabbitProxy.emit<void, RabbitPayload<any>>(queue, {
      data: testPayload,
    });
    await waitConsumeQueue(this.rabbitClient, queue);
    expect(serviceSpy).toHaveBeenCalledWith(testPayload);
  }

  public async whenErrorsWithAttempts(): Promise<void> {
    const serviceSpy = jest.spyOn(this.ternaryQueueService, 'handle');

    const mainQ = `${TERNARY_QUEUE_ERROR}.main.queue`;
    const retryQ = `${TERNARY_QUEUE_ERROR}.retry.queue`;
    const archiveQ = `${TERNARY_QUEUE_ERROR}.archive.queue`;

    const testPayload = {
      msgId: randomUUID(),
      data: 'errors with attempts test',
    };
    const channel = this.rabbitClient.getChannel();

    await channel.purgeQueue(mainQ);
    await channel.purgeQueue(retryQ);
    await channel.purgeQueue(archiveQ);

    this.rabbitProxy.emit<void, RabbitPayload<any>>(mainQ, {
      data: testPayload,
    });
    await waitConsumeTernaryQueue(this.rabbitClient, mainQ, retryQ);
    expect(serviceSpy).toHaveBeenCalledTimes(TEST_ATTEMPT_COUNT);
  }

  public async whenArchiveQueue(): Promise<void> {
    const serviceSpy = jest.spyOn(this.ternaryQueueService, 'handle');

    const mainQ = `${TERNARY_QUEUE_ARCHIVE}.main.queue`;
    const retryQ = `${TERNARY_QUEUE_ARCHIVE}.retry.queue`;
    const archiveQ = `${TERNARY_QUEUE_ARCHIVE}.archive.queue`;

    const testPayload = {
      msgId: randomUUID(),
      data: 'error check archive',
    };

    const channel = this.rabbitClient.getChannel();

    await channel.purgeQueue(mainQ);
    await channel.purgeQueue(retryQ);
    await channel.purgeQueue(archiveQ);

    this.rabbitProxy.emit<void, RabbitPayload<any>>(mainQ, {
      data: testPayload,
    });
    await waitConsumeTernaryQueue(this.rabbitClient, mainQ, retryQ);

    const mainQInfo = await channel.checkQueue(mainQ);
    const retryQInfo = await channel.checkQueue(retryQ);
    const archiveQInfo = await channel.checkQueue(archiveQ);

    expect(mainQInfo.messageCount).toEqual(0);
    expect(retryQInfo.messageCount).toEqual(0);
    expect(archiveQInfo.messageCount).toEqual(1);

    expect(serviceSpy).toHaveBeenCalledTimes(3);
  }
}
