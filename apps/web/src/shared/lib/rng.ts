import type { Rng } from '@nekotype/shared/types';

export const defaultRng: Rng = {
  next: () => Math.random(),
};
