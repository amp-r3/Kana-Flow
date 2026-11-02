export type { Rng, Clock, Scheduler, TimeoutHandle } from '@nekotype/shared/types';
export { defaultRng } from './rng';

export { defaultClock } from './clock';

export { defaultScheduler } from './scheduler';

export { cx } from './cx';

export type { KeyValueStore } from './storage';
export {
  MemoryKeyValueStore,
  LocalStorageStore,
  STORAGE_KEYS,
  createDebouncedSaver,
} from './storage';

export type {
  ValidTestConfig,
  ValidSettings,
  ValidKanaStats,
  ValidProgress,
} from '@nekotype/shared/types';

export {
  isObject,
  isTestConfig,
  isSettings,
  isKanaStats,
  isProgress,
} from '@nekotype/shared/runtime';
