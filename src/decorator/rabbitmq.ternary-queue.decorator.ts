import { EventPattern } from '@nestjs/microservices';
import { TernaryQueueOpts } from '../types';
import { buildMetaPackage, RabbitmqStrategy } from '../meta';

/**
 * TernaryQueue — a structured retry strategy with 3 stages:
 *
 * 1. **Try**: The message is first sent to the main processing queue.
 * 2. **Retry**: If processing fails, it's routed to a retry queue with a delay,
 *    and then re-injected into the main queue.
 * 3. **Archive**: After a maximum number of attempts, the message is moved to an
 *    archive/dead-letter queue for storage or manual inspection.
 *
 * This decorator wraps the handler with RabbitMQ metadata to implement the TernaryQueue pattern.
 */
export const TernaryQueue = (opts: TernaryQueueOpts): MethodDecorator => {
  return (target, propertyKey, descriptor) => {
    const meta = buildMetaPackage(RabbitmqStrategy.TERNARY_QUEUE, opts);
    Reflect.defineMetadata('rabbit:meta', meta, descriptor.value);
    EventPattern(opts.name, { meta })(target, propertyKey, descriptor);
  };
};
