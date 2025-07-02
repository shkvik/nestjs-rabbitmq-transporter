import { EventPattern } from '@nestjs/microservices';
import { PureQueueOpts } from '../types';
import { buildMetaPackage, RabbitmqStrategy } from '../meta';

export const PureQueue = (opts: PureQueueOpts): MethodDecorator => {
  return (target, propertyKey, descriptor) => {
    const meta = buildMetaPackage(RabbitmqStrategy.PURE_QUEUE, opts);
    Reflect.defineMetadata('rabbit:meta', meta, descriptor.value);
    EventPattern(opts.name, { meta })(target, propertyKey, descriptor);
  };
};
