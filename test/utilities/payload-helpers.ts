import { randomUUID } from 'node:crypto';

export interface TestUniqePayload {
  msgId: string;
  data: string;
}

export const buildUniqePayload = (msg: string): TestUniqePayload => {
  return {
    msgId: randomUUID(),
    data: msg,
  };
};
