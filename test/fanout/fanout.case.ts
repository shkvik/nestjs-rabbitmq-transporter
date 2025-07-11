import { INestApplication } from '@nestjs/common';
import { RabbitClient } from 'src/rabbitmq.client';
import { RabbitProxy } from 'src/rabbitmq.proxy';
import { FanoutService } from './fanout.controllers';
import { buildUniqePayload } from '../utilities/payload-helpers';
import {
  FANOUT_TEST_RABBIT_EXCHANGE,
  TEST_AT_LEAST_ONCE_Q_FANOUT,
  TEST_AT_MOST_ONCE_Q_FANOUT,
  TEST_TERNARY_Q_1_FANOUT,
  TEST_TERNARY_Q_2_FANOUT,
} from './fanout.constant';
import { getAllTernaryQueues } from '../utilities/ternary.naming';
import { RabbitPayload } from 'src/types';
import {
  waitConsumeQueue,
  waitConsumeTernaryQueue,
} from '../utilities/wait-consume';
import { RpcException } from '@nestjs/microservices';

export class FanoutCase {
  private readonly fanoutService: FanoutService;
  private readonly rabbitClient: RabbitClient;
  private readonly rabbitProxy: RabbitProxy;

  constructor(app: INestApplication) {
    this.fanoutService = app.get(FanoutService);
    this.rabbitProxy = app.get<RabbitProxy>('RabbitProxy');
    this.rabbitClient = this.rabbitProxy.unwrap<RabbitClient>();
  }

  public async whenAllRight() {
    await this.purgeAllQueues();

    const {
      handleTernary1Spy,
      handleTernary2Spy,
      handlePureAtLeastOnceSpy,
      handlePureAtMostOnceSpy,
    } = this.getJestSpy();

    const testPayload = buildUniqePayload('fanout_msg: whenAllRight');

    this.rabbitProxy.emit<void, RabbitPayload<any>>('', {
      exchange: FANOUT_TEST_RABBIT_EXCHANGE.name,
      data: testPayload,
    });

    await this.waitAllQueues();

    expect(handleTernary1Spy).toHaveBeenCalled();
    expect(handleTernary2Spy).toHaveBeenCalled();
    expect(handlePureAtLeastOnceSpy).toHaveBeenCalled();
    expect(handlePureAtMostOnceSpy).toHaveBeenCalled();

    await this.purgeAllQueues();
  }

  public async oneOfTheTernaryQueueThrowError() {
    await this.purgeAllQueues();

    const {
      handleTernary1Spy,
      handleTernary2Spy,
      handlePureAtLeastOnceSpy,
      handlePureAtMostOnceSpy,
    } = this.getJestSpy();

    handleTernary1Spy.mockImplementationOnce(() => {
      throw new RpcException('oneOfTheTernaryQueueThrowError');
    });

    const testPayload = buildUniqePayload(
      'fanout_msg: oneOfTheTernaryQueueThrowError',
    );

    this.rabbitProxy.emit<void, RabbitPayload<any>>('', {
      exchange: FANOUT_TEST_RABBIT_EXCHANGE.name,
      data: testPayload,
    });

    await this.waitAllQueues();

    expect(handleTernary1Spy).toHaveBeenCalledTimes(2);
    expect(handleTernary2Spy).toHaveBeenCalled();
    expect(handlePureAtLeastOnceSpy).toHaveBeenCalled();
    expect(handlePureAtMostOnceSpy).toHaveBeenCalled();
  }

  public async atMostOnceThrowError() {
    await this.purgeAllQueues();

    const {
      handleTernary1Spy,
      handleTernary2Spy,
      handlePureAtLeastOnceSpy,
      handlePureAtMostOnceSpy,
    } = this.getJestSpy();

    handlePureAtMostOnceSpy.mockImplementationOnce(() => {
      throw new RpcException('atMostOnceThrowError');
    });

    const testPayload = buildUniqePayload(
      'fanout_msg: oneOfTheTernaryQueueThrowError',
    );

    this.rabbitProxy.emit<void, RabbitPayload<any>>('', {
      exchange: FANOUT_TEST_RABBIT_EXCHANGE.name,
      data: testPayload,
    });

    await this.waitAllQueues();

    expect(handleTernary1Spy).toHaveBeenCalled();
    expect(handleTernary2Spy).toHaveBeenCalled();
    expect(handlePureAtLeastOnceSpy).toHaveBeenCalled();
    expect(handlePureAtMostOnceSpy).toHaveBeenCalledTimes(1);
  }

  public async atLeastOnceThrowError() {
    await this.purgeAllQueues();

    const {
      handleTernary1Spy,
      handleTernary2Spy,
      handlePureAtLeastOnceSpy,
      handlePureAtMostOnceSpy,
    } = this.getJestSpy();

    handlePureAtLeastOnceSpy.mockImplementationOnce(() => {
      throw new RpcException('atMostOnceThrowError');
    });

    const testPayload = buildUniqePayload(
      'fanout_msg: oneOfTheTernaryQueueThrowError',
    );

    this.rabbitProxy.emit<void, RabbitPayload<any>>('', {
      exchange: FANOUT_TEST_RABBIT_EXCHANGE.name,
      data: testPayload,
    });

    await this.waitAllQueues();

    expect(handleTernary1Spy).toHaveBeenCalled();
    expect(handleTernary2Spy).toHaveBeenCalled();
    expect(handlePureAtLeastOnceSpy).toHaveBeenCalledTimes(2);
    expect(handlePureAtMostOnceSpy).toHaveBeenCalled();
  }

  private async waitAllQueues(): Promise<void> {
    const ternary1Queues = getAllTernaryQueues(TEST_TERNARY_Q_1_FANOUT);
    const ternary2Queues = getAllTernaryQueues(TEST_TERNARY_Q_2_FANOUT);

    const ternary1Promise = waitConsumeTernaryQueue(
      this.rabbitClient,
      ternary1Queues.mainQ,
      ternary1Queues.retryQ,
    );
    const ternary2Promise = waitConsumeTernaryQueue(
      this.rabbitClient,
      ternary2Queues.mainQ,
      ternary2Queues.retryQ,
    );
    const atMostOnceQPromise = waitConsumeQueue(
      this.rabbitClient,
      TEST_AT_MOST_ONCE_Q_FANOUT,
    );
    const atleastOnceQPromise = waitConsumeQueue(
      this.rabbitClient,
      TEST_AT_LEAST_ONCE_Q_FANOUT,
    );

    await Promise.all([
      ternary1Promise,
      ternary2Promise,
      atMostOnceQPromise,
      atleastOnceQPromise,
    ]);
  }

  private async purgeAllQueues() {
    const ternary1Queues = Object.values(
      getAllTernaryQueues(TEST_TERNARY_Q_1_FANOUT),
    ) as string[];

    const ternary2Queues = Object.values(
      getAllTernaryQueues(TEST_TERNARY_Q_2_FANOUT),
    ) as string[];

    const allTestQueues = [
      ...ternary1Queues,
      ...ternary2Queues,
      TEST_AT_MOST_ONCE_Q_FANOUT,
      TEST_AT_LEAST_ONCE_Q_FANOUT,
    ];
    const channel = this.rabbitClient.getChannel();

    await Promise.all(allTestQueues.map((queue) => channel.purgeQueue(queue)));
  }

  private getJestSpy(): {
    handleTernary1Spy: jest.SpyInstance<void, [dto: unknown], any>;
    handleTernary2Spy: jest.SpyInstance<void, [dto: unknown], any>;
    handlePureAtLeastOnceSpy: jest.SpyInstance<void, [dto: unknown], any>;
    handlePureAtMostOnceSpy: jest.SpyInstance<void, [dto: unknown], any>;
  } {
    const handleTernary1Spy = jest.spyOn(this.fanoutService, 'handleTernary1');
    const handleTernary2Spy = jest.spyOn(this.fanoutService, 'handleTernary2');
    const handlePureAtLeastOnceSpy = jest.spyOn(
      this.fanoutService,
      'handlePureAtLeastOnce',
    );
    const handlePureAtMostOnceSpy = jest.spyOn(
      this.fanoutService,
      'handlePureAtMostOnce',
    );
    return {
      handleTernary1Spy,
      handleTernary2Spy,
      handlePureAtLeastOnceSpy,
      handlePureAtMostOnceSpy,
    };
  }
}
