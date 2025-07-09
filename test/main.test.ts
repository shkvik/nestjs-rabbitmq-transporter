import { INestApplication } from '@nestjs/common';
import { AppBuilder } from './app.builder';
import { TernaryQueueCase } from './ternary-queue/ternary-queue.case';
import { PureQueueCase } from './pure-queue/pure-queue.case';
import { RabbitProxyCase } from './rabbit-proxy/rabbit-proxy.case';

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
    it('AutoAck + Requeue', async () => {
      await cases.autoAckRequeue();
    });
    it('AutoAck + Skip', async () => {
      await cases.autoAckSkip();
    });
    it('AutoAck + Dlx', async () => {
      await cases.autoAckDlx();
    });
    it('AutoAck + Off', async () => {
      await cases.autoAckOff();
    });
    it('NoAck + Requeue', async () => {
      await cases.noAckRequeue();
    });
    it('NoAck + Skip', async () => {
      await cases.noAckSkip();
    });
    it('NoAck + Dlx', async () => {
      await cases.noAckDlx();
    });
    it('NoAck + Off', async () => {
      await cases.noAckOff();
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
});
