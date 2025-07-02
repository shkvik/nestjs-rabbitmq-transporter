import { ReadPacket } from '@nestjs/microservices';

export interface ReadPacket2<T = any> extends ReadPacket<T> {
  exchange?: string;
}
