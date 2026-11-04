import { describe, it, expect, beforeEach } from 'vitest';
import { setupSettingsResetWatcher } from './settings-watcher';
import {
  setScript,
  setContent,
  setStrictness,
  setWeakFocus,
  toggleRow,
  initSettings,
  setTestConfig,
} from '@/entities/settings';
import { MemoryKeyValueStore } from '@/shared/lib';

describe('settings-watcher: one reactive effect calling the reset callback', () => {
  let resetCallCount = 0;
  let dispose: (() => void) | null = null;

  beforeEach(() => {
    const store = new MemoryKeyValueStore();
    initSettings(store);
    resetCallCount = 0;
    if (dispose) {
      dispose();
    }
    dispose = setupSettingsResetWatcher(() => {
      resetCallCount++;
    });
  });

  it('invokes the callback once per change of any of the six settings, not for the initial values', () => {
    expect(resetCallCount).toBe(0);

    // 1. Script change
    setScript('katakana');
    expect(resetCallCount).toBe(1);

    // 2. Content change
    setContent('words');
    expect(resetCallCount).toBe(2);

    // 3. Strictness change
    setStrictness('ime');
    expect(resetCallCount).toBe(3);

    // 4. Row toggle
    toggleRow('k');
    expect(resetCallCount).toBe(4);

    // 5. Weak focus toggle
    setWeakFocus(false);
    expect(resetCallCount).toBe(5);

    // 6. Test config change
    setTestConfig({ kind: 'count', prompts: 50 });
    expect(resetCallCount).toBe(6);
  });

  it('stops listening when disposed', () => {
    if (dispose) dispose();
    resetCallCount = 0;

    setScript('hiragana');
    expect(resetCallCount).toBe(0);
  });
});
