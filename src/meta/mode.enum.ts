import { PureQueueOpts, TernaryQueueOpts } from 'src/types';

/**
 * Enum defining the supported RabbitMQ strategies.
 */
export enum RabbitmqStrategy {
  PURE_QUEUE, // Simple FIFO queue strategy
  TERNARY_QUEUE, // Retry/requeue/dead-letter queue strategy
}

/**
 * Mapping from each strategy to its specific options type.
 */
export type StrategyOptsMap = {
  [RabbitmqStrategy.PURE_QUEUE]: PureQueueOpts;
  [RabbitmqStrategy.TERNARY_QUEUE]: TernaryQueueOpts;
};

/**
 * Metadata package for a given strategy, pairing its type with the corresponding options.
 *
 * @template T - The key of StrategyOptsMap indicating which strategy is used.
 */
export type StrategyPackageMeta<T extends keyof StrategyOptsMap> = {
  readonly type: T; // The chosen strategy type
  readonly opts: StrategyOptsMap[T]; // Configuration options for that strategy
};

/**
 * Helper function to build a strategy metadata package.
 *
 * @param type - The strategy type to use (PURE_QUEUE or TERNARY_QUEUE).
 * @param opts - The configuration options matching the chosen strategy.
 * @returns A StrategyPackageMeta containing both the type and its options.
 */
export const buildMetaPackage = <T extends keyof StrategyOptsMap>(
  type: T,
  opts: StrategyOptsMap[T],
): StrategyPackageMeta<T> => {
  return { type, opts };
};
