import { INestApplication } from '@nestjs/common';
import { AppBuilder } from './app.builder';
import { TernaryQueueCase } from './ternary-queue/ternary-queue.case';
import { PureQueueCase } from './pure-queue/pure-queue.case';
import { RabbitProxyCase } from './rabbit-proxy/rabbit-proxy.case';
import { FanoutCase } from './fanout/fanout.case';

describe('NestJs RabbitMQ Transporter Tests', () => {
  let builder: AppBuilder;
  let app: INestApplication;

  beforeAll(async () => {
    builder = new AppBuilder();
    app = await builder.create();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(async () => {
    await builder.dispose();
  });
  describe('RabbitProxy', () => {
    let cases: RabbitProxyCase;

    beforeAll(() => {
      cases = new RabbitProxyCase(app);
    });
    it('Connect to RabbitMQ', async () => {
      await cases.connect();
    });
    it('Close connection', async () => {
      await cases.close();
    });
    it('Dispatch event without confirmation', async () => {
      await cases.dispatch();
    });
    it('Dispatch event when confirmation', async () => {
      await cases.dispatchConfirmed();
    });
    it('Dispatch event handles missing options', async () => {
      await cases.dispatchMissingOpts();
    });
  });
  describe('PureQueue', () => {
    let cases: PureQueueCase;

    beforeAll(() => {
      cases = new PureQueueCase(app);
    });
    it('AutoAck + Requeue → success', async () => {
      await cases.autoAckRequeueOk();
    });
    it('AutoAck + Requeue → failure', async () => {
      await cases.autoAckRequeueError();
    });

    it('AutoAck + Skip → success', async () => {
      await cases.autoAckSkipOk();
    });
    it('AutoAck + Skip failure', async () => {
      await cases.autoAckSkipError();
    });

    it('AutoAck + DLX → success', async () => {
      await cases.autoAckDlxOk();
    });
    it('AutoAck + DLX → failure', async () => {
      await cases.autoAckDlxError();
    });

    it('AutoAck + Off → success', async () => {
      await cases.autoAckOffOk();
    });
    it('AutoAck + Off → failure', async () => {
      await cases.autoAckOffError();
    });

    it('NoAck + Requeue → success', async () => {
      await cases.noAckRequeueOk();
    });
    it('NoAck + Requeue → failure', async () => {
      await cases.noAckRequeueError();
    });

    it('NoAck + Skip → success', async () => {
      await cases.noAckSkipOk();
    });
    it('NoAck + Skip → failure', async () => {
      await cases.noAckSkipError();
    });

    it('NoAck + DLX → success', async () => {
      await cases.noAckDlxOk();
    });
    it('NoAck + DLX → failure', async () => {
      await cases.noAckDlxError();
    });

    it('NoAck + Off → success', async () => {
      await cases.noAckOffOk();
    });
    it('NoAck + Off → failure', async () => {
      await cases.noAckOffError();
    });
  });
  describe('TernaryQueue', () => {
    let cases: TernaryQueueCase;

    beforeAll(() => {
      cases = new TernaryQueueCase(app);
    });
    it('When all right', async () => {
      await cases.whenAllRight();
    });
    it('When errors with attempts', async () => {
      await cases.whenErrorsWithAttempts();
    });
    it('When archive queue', async () => {
      await cases.whenArchiveQueue();
    });
  });

  describe('Fanout', () => {
    let cases: FanoutCase;

    beforeAll(() => {
      cases = new FanoutCase(app);
    });
    it('When all right', async () => {
      await cases.whenAllRight();
    });
    it('If one of the ternary queue throw error', async () => {
      await cases.oneOfTheTernaryQueueThrowError();
    });
    it('If queue at most once throw error', async () => {
      await cases.atMostOnceThrowError();
    });
    it('If queue at least once throw error', async () => {
      await cases.atLeastOnceThrowError();
    });
  });
});
