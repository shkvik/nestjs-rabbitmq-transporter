import { INestApplication } from '@nestjs/common';
import { AppBuilder } from './app.builder';
import { TernaryQueueCase } from './ternary-queue/ternary-queue.case';

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
  describe('TernaryQueue', () => {
    let cases: TernaryQueueCase;

    beforeAll(async () => {
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
