import { PureQueueOpts, TernaryQueueOpts } from 'src/types';

export enum RabbitmqStrategy {
  PURE_QUEUE,
  TERNARY_QUEUE,
}

export type StrategyOptsMap = {
  [RabbitmqStrategy.PURE_QUEUE]: PureQueueOpts;
  [RabbitmqStrategy.TERNARY_QUEUE]: TernaryQueueOpts;
};

export type StrategyPackageMeta<T extends keyof StrategyOptsMap> = {
  readonly type: T;
  readonly opts: StrategyOptsMap[T];
};

export const buildMetaPackage = <T extends keyof StrategyOptsMap>(
  type: T,
  opts: StrategyOptsMap[T],
): StrategyPackageMeta<T> => {
  return { type, opts };
};
