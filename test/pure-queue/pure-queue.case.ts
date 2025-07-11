import { INestApplication } from '@nestjs/common';
import { RabbitClient } from 'src/rabbitmq.client';
import { RabbitProxy } from 'src/rabbitmq.proxy';
import { PureQueueService } from './pure-queue.controllers';
import { AUTO_ACK__REQUEUE, AUTO_ACK__SKIP } from './pure-queue.constant';
import { randomUUID } from 'node:crypto';
import { RabbitPayload } from 'src/types';
import { waitConsumeQueue } from '../utilities/wait-consume';
import { RpcException } from '@nestjs/microservices';
import { buildUniqePayload } from '../utilities/payload-helpers';

export class PureQueueCase {
  private readonly pureQueueService: PureQueueService;
  private readonly rabbitClient: RabbitClient;
  private readonly rabbitProxy: RabbitProxy;

  constructor(app: INestApplication) {
    this.pureQueueService = app.get(PureQueueService);
    this.rabbitProxy = app.get<RabbitProxy>('RabbitProxy');
    this.rabbitClient = this.rabbitProxy.unwrap<RabbitClient>();
  }

  public async autoAckRequeueOk(): Promise<void> {
    const serviceSpy = jest.spyOn(this.pureQueueService, 'handle');
    const queue = AUTO_ACK__REQUEUE.name;
    const testPayload = buildUniqePayload('autoAckRequeueOk');

    await this.rabbitClient.getChannel().purgeQueue(queue);
    this.rabbitProxy.emit<void, RabbitPayload<any>>(queue, {
      data: testPayload,
    });
    await waitConsumeQueue(this.rabbitClient, queue);
    expect(serviceSpy).toHaveBeenCalledWith(testPayload);
  }

  public async autoAckRequeueError(): Promise<void> {
    const serviceSpy = jest
      .spyOn(this.pureQueueService, 'handle')
      .mockImplementationOnce(() => {
        throw new RpcException('autoAckRequeueError');
      });

    const queue = AUTO_ACK__REQUEUE.name;
    const testPayload = buildUniqePayload('autoAckRequeueError');

    await this.rabbitClient.getChannel().purgeQueue(queue);
    this.rabbitProxy.emit<void, RabbitPayload<any>>(queue, {
      data: testPayload,
    });
    await waitConsumeQueue(this.rabbitClient, queue);
    expect(serviceSpy).toHaveBeenCalledTimes(2);
  }

  public async autoAckSkipOk(): Promise<void> {
    const serviceSpy = jest.spyOn(this.pureQueueService, 'handle');
    const queue = AUTO_ACK__SKIP.name;
    const testPayload = buildUniqePayload('autoAckSkipOk');

    await this.rabbitClient.getChannel().purgeQueue(queue);
    this.rabbitProxy.emit<void, RabbitPayload<any>>(queue, {
      data: testPayload,
    });
    await waitConsumeQueue(this.rabbitClient, queue);
    expect(serviceSpy).toHaveBeenCalledWith(testPayload);
  }

  public async autoAckSkipError(): Promise<void> {
    const serviceSpy = jest
      .spyOn(this.pureQueueService, 'handle')
      .mockImplementationOnce(() => {
        throw new RpcException('autoAckSkipError');
      });

    const queue = AUTO_ACK__SKIP.name;
    const testPayload = buildUniqePayload('autoAckSkipError');

    await this.rabbitClient.getChannel().purgeQueue(queue);
    this.rabbitProxy.emit<void, RabbitPayload<any>>(queue, {
      data: testPayload,
    });
    await waitConsumeQueue(this.rabbitClient, queue);
    expect(serviceSpy).toHaveBeenCalledTimes(1);
  }

  public async autoAckDlxOk(): Promise<void> {}
  public async autoAckDlxError(): Promise<void> {}

  public async autoAckOffOk(): Promise<void> {}
  public async autoAckOffError(): Promise<void> {}

  public async noAckRequeueOk(): Promise<void> {}
  public async noAckRequeueError(): Promise<void> {}

  public async noAckSkipOk(): Promise<void> {}
  public async noAckSkipError(): Promise<void> {}

  public async noAckDlxOk(): Promise<void> {}
  public async noAckDlxError(): Promise<void> {}

  public async noAckOffOk(): Promise<void> {}
  public async noAckOffError(): Promise<void> {}
}
