import { AckPolicy, NackPolicy, PureQueueOpts } from 'src/types';

export const AUTO_ACK__REQUEUE: PureQueueOpts = {
  name: 'test_q_auto_ack__requeue',
  consumeOpts: {
    ackPolicy: AckPolicy.AUTO,
    nackPolicy: NackPolicy.REQUEUE,
  },
};

export const AUTO_ACK__SKIP: PureQueueOpts = {
  name: 'test_q_auto_ack__skip',
  consumeOpts: {
    ackPolicy: AckPolicy.AUTO,
    nackPolicy: NackPolicy.SKIP,
  },
};

export const AUTO_ACK__DLX: PureQueueOpts = {
  name: 'test_q_auto_ack__dlx',
  consumeOpts: {
    ackPolicy: AckPolicy.AUTO,
    nackPolicy: NackPolicy.DLX,
  },
};

export const AUTO_ACK__OFF: PureQueueOpts = {
  name: 'test_q_auto_ack__off',
  consumeOpts: {
    ackPolicy: AckPolicy.AUTO,
    nackPolicy: NackPolicy.OFF,
  },
};

export const NO_ACK__REQUEUE: PureQueueOpts = {
  name: 'test_q_no_ack__requeue',
  consumeOpts: {
    ackPolicy: AckPolicy.OFF,
    nackPolicy: NackPolicy.REQUEUE,
  },
};

export const NO_ACK__SKIP: PureQueueOpts = {
  name: 'test_q_no_ack__skip',
  consumeOpts: {
    ackPolicy: AckPolicy.OFF,
    nackPolicy: NackPolicy.SKIP,
  },
};

export const NO_ACK__DLX: PureQueueOpts = {
  name: 'test_q_no_ack__dlx',
  consumeOpts: {
    ackPolicy: AckPolicy.OFF,
    nackPolicy: NackPolicy.DLX,
  },
};

export const NO_ACK__OFF: PureQueueOpts = {
  name: 'test_q_no_ack__off',
  consumeOpts: {
    ackPolicy: AckPolicy.OFF,
    nackPolicy: NackPolicy.OFF,
  },
};
