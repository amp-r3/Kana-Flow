export type TimeoutHandle = {
  readonly id: number | ReturnType<typeof setTimeout>;
};

export interface Scheduler {
  setTimeout(fn: () => void, ms: number): TimeoutHandle;
  clearTimeout(handle: TimeoutHandle): void;
  setInterval(fn: () => void, ms: number): TimeoutHandle;
  clearInterval(handle: TimeoutHandle): void;
}

export const defaultScheduler: Scheduler = {
  setTimeout: (fn, ms) => ({ id: setTimeout(fn, ms) }),
  clearTimeout: (handle) => {
    clearTimeout(handle.id);
  },
  setInterval: (fn, ms) => ({ id: setInterval(fn, ms) }),
  clearInterval: (handle) => {
    clearInterval(handle.id);
  },
};
