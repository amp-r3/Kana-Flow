export interface KeyValueStore {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

export class MemoryKeyValueStore implements KeyValueStore {
  private data = new Map<string, string>();

  get(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  set(key: string, value: string): void {
    this.data.set(key, value);
  }

  remove(key: string): void {
    this.data.delete(key);
  }

  clear(): void {
    this.data.clear();
  }
}

export class LocalStorageStore implements KeyValueStore {
  get(key: string): string | null {
    if (typeof window === 'undefined') {
      return null;
    }
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  set(key: string, value: string): void {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Ignore quota or security errors in private browsing
    }
  }

  remove(key: string): void {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore errors
    }
  }
}

export const STORAGE_KEYS = {
  SETTINGS: 'kanaflow:settings:v1',
  PROGRESS: 'kanaflow:progress:v1',
  LOCALE: 'nekotype:locale',
} as const;

export function createDebouncedSaver(saveFn: () => void, delayMs = 300) {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const trigger = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      saveFn();
    }, delayMs);
  };

  const flush = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
      saveFn();
    }
  };

  return { trigger, flush };
}
