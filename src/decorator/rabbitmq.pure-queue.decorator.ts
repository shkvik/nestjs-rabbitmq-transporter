import { EventPattern } from '@nestjs/microservices';
import { PureQueueOpts } from '../types';
import { buildMetaPackage, RabbitmqStrategy } from '../meta';

/**
 * Decorator that binds a method to a pure RabbitMQ queue.
 *
 * - Attaches metadata for the PURE_QUEUE strategy.
 * - Registers the method as a message handler for the specified queue.
 */
export const PureQueue = (opts: PureQueueOpts): MethodDecorator => {
  return (target, propertyKey, descriptor) => {
    const meta = buildMetaPackage(RabbitmqStrategy.PURE_QUEUE, opts);
    Reflect.defineMetadata('rabbit:meta', meta, descriptor.value);
    EventPattern(opts.name, { meta })(target, propertyKey, descriptor);
  };
};
