import { Options } from 'amqplib';

/**
 * Structure of a message payload sent through RabbitProxy.
 */
export interface RabbitPayload<Data = any> {
  /** The actual message data to be serialized and sent */
  data: Data;

  /** Optional exchange name to publish the message to */
  exchange?: string;

  /** Optional AMQP publish options (e.g., headers, persistent, etc.) */
  options?: Options.Publish;
}
