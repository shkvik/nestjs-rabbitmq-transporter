import { INestApplication } from '@nestjs/common';
import { RabbitClient } from 'src/rabbitmq.client';
import { RabbitProxy } from 'src/rabbitmq.proxy';
import { PureQueueService } from './pure-queue.controllers';
import { AUTO_ACK__REQUEUE } from './pure-queue.constant';
import { randomUUID } from 'node:crypto';
import { RabbitPayload } from 'src/types';
import { waitConsumeQueue } from '../utilities/wait-consume';

export class PureQueueCase {
  private readonly pureQueueService: PureQueueService;
  private readonly rabbitClient: RabbitClient;
  private readonly rabbitProxy: RabbitProxy;

  constructor(app: INestApplication) {
    this.pureQueueService = app.get(PureQueueService);
    this.rabbitProxy = app.get<RabbitProxy>('RabbitProxy');
    this.rabbitClient = this.rabbitProxy.unwrap<RabbitClient>();
  }

  public async autoAckRequeue(): Promise<void> {
    await this.autoAckRequeueOk();
    await this.autoAckRequeueError();
  }

  public async autoAckSkip(): Promise<void> {
    await this.autoAckSkipOk();
    await this.autoAckSkipError();
  }

  public async autoAckDlx(): Promise<void> {
    await this.autoAckDlxOk();
    await this.autoAckDlxError();
  }

  public async autoAckOff(): Promise<void> {
    await this.autoAckOffOk();
    await this.autoAckOffError();
  }

  public async noAckRequeue(): Promise<void> {
    await this.noAckRequeueOk();
    await this.noAckRequeueError();
  }

  public async noAckSkip(): Promise<void> {
    await this.noAckSkipOk();
    await this.noAckSkipError();
  }

  public async noAckDlx(): Promise<void> {
    await this.noAckDlxOk();
    await this.noAckDlxError();
  }

  public async noAckOff(): Promise<void> {
    await this.noAckOffOk();
    await this.noAckOffError();
  }

  private async autoAckRequeueOk(): Promise<void> {
    const serviceSpy = jest.spyOn(this.pureQueueService, 'handle');
    const queue = AUTO_ACK__REQUEUE.name;
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

  private async autoAckRequeueError(): Promise<void> {}
  private async autoAckSkipOk(): Promise<void> {}
  private async autoAckSkipError(): Promise<void> {}
  private async autoAckDlxOk(): Promise<void> {}
  private async autoAckDlxError(): Promise<void> {}
  private async autoAckOffOk(): Promise<void> {}
  private async autoAckOffError(): Promise<void> {}
  private async noAckRequeueOk(): Promise<void> {}
  private async noAckRequeueError(): Promise<void> {}
  private async noAckSkipOk(): Promise<void> {}
  private async noAckSkipError(): Promise<void> {}
  private async noAckDlxOk(): Promise<void> {}
  private async noAckDlxError(): Promise<void> {}
  private async noAckOffOk(): Promise<void> {}
  private async noAckOffError(): Promise<void> {}
}
