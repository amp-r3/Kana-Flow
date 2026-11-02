import type { Clock } from '@nekotype/shared/types';

export const defaultClock: Clock = {
  now: () => Date.now(),
};
