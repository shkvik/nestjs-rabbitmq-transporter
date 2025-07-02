import { Observable, of } from 'rxjs';
import { RabbitContext } from 'src/types';

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
