import { Observable, of } from 'rxjs';
import { RabbitContext } from 'src/types';

/**
 * Executes a NestJS-style message handler, ensuring the result is always an Observable.
 *
 * @param data - The deserialized message payload.
 * @param ctx - The RabbitMQ context (channel + message).
 * @param callback - The handler function to execute.
 * @returns An Observable wrapping the handler result.
 */
export const executeNestjsHandler = async (
  data: unknown,
  ctx: RabbitContext,
  callback: (
    ...args: unknown[]
  ) => Promise<Observable<unknown>> | Promise<unknown>,
): Promise<Observable<unknown>> => {
  const result = await callback(data, ctx);
  return result instanceof Observable ? result : of(result);
};
