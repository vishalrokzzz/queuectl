export const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const computeBackoffRunAfter = (base: number, attempts: number): number => {
  const delay = Math.pow(base, attempts);
  const now = Math.floor(Date.now() / 1000);
  return now + delay;
};
