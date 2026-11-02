export interface Clock {
  now(): number;
}

export const defaultClock: Clock = {
  now: () => Date.now(),
};
