export type ConnectedMsg = {
  port: number;
  host: string;
};

export type DisconnectedMsg = {
  reason?: string;
};
