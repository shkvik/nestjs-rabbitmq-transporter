import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { ExampleModule } from "./example";
//import { NatsClientModule } from "./nast-client/nats-client.module";
//import { NatsTransporter } from "src/index";

export class AppBuilder {
  private app: INestApplication<unknown>;

  public async create(): Promise<INestApplication<unknown>> {
    const moduleRef = await Test.createTestingModule({
      imports: [ExampleModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    // app.connectMicroservice({
    //   strategy: new NatsTransporter({
    //     servers: ['nats://0.0.0.0:4222'],
    //     user: 'nats_user',
    //     pass: 'nats_password',
    //     test: true
    //   })
    // });
    await app.startAllMicroservices();
    this.app = app;
    return app.init();
  }

  public async dispose() {
    await this.app.close();
  }
}