import { RabbitExchange } from 'src/types';

export const TEST_TERNARY_Q_1_FANOUT = 'test_ternary_q_1_fanout';
export const TEST_TERNARY_Q_2_FANOUT = 'test_ternary_q_2_fanout';
export const TEST_AT_MOST_ONCE_Q_FANOUT = 'test_at_most_once_q_fanout';
export const TEST_AT_LEAST_ONCE_Q_FANOUT = 'test_at_least_once_q_fanout';

export const FANOUT_TEST_RABBIT_EXCHANGE: RabbitExchange = {
  name: 'fanout_test_rabbit_exchange',
  type: 'fanout',
  options: { durable: true },
};
