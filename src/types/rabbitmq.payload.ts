import { Options } from 'amqplib';

export interface RabbitPayload<Data = any> {
  data: Data;
  exchange?: string;
  options?: Options.Publish;
}
