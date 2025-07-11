export interface AllTernaryQueues {
  mainQ: string;
  retryQ: string;
  archiveQ: string;
}

export const getAllTernaryQueues = (name: string): AllTernaryQueues => {
  return {
    mainQ: `${name}.main.queue`,
    retryQ: `${name}.retry.queue`,
    archiveQ: `${name}.archive.queue`,
  };
};
