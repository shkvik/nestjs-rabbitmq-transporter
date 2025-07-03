import { EventPattern } from '@nestjs/microservices';
import { TernaryQueueOpts } from '../types';
import { buildMetaPackage, RabbitmqStrategy } from '../meta';

/**
 * TernaryQueue — a structured retry strategy with 3 stages:
 *
 * 1. Try: Message goes to the main queue for processing.
 * 2. Retry: On failure, it’s delayed and retried via a retry queue.
 * 3. Archive: After max attempts, it’s sent to an archive queue.
 *
 * This mode creates 3 queues and, by default, retries 3 times with a 5s delay.
 * This decorator wraps the handler with RabbitMQ metadata to implement the TernaryQueue pattern.
 */
export const TernaryQueue = (opts: TernaryQueueOpts): MethodDecorator => {
  return (target, propertyKey, descriptor) => {
    const meta = buildMetaPackage(RabbitmqStrategy.TERNARY_QUEUE, opts);
    Reflect.defineMetadata('rabbit:meta', meta, descriptor.value);
    EventPattern(opts.name, { meta })(target, propertyKey, descriptor);
  };
};
