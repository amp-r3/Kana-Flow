import { describe, it, expect, beforeEach } from 'vitest';
import { setupSettingsResetWatcher } from './settings-watcher';
import {
  setScript,
  setContent,
  setStrictness,
  setWeakFocus,
  toggleRow,
  initPracticeSettings,
} from '@/entities/kana';
import { phase, startTest, setTestConfig, initSession } from '@/entities/session';
import { MemoryKeyValueStore } from '@/shared/lib';

describe('settings-watcher: single reactive effect resetting session to idle', () => {
  let resetCallCount = 0;
  let dispose: (() => void) | null = null;

  beforeEach(() => {
    const store = new MemoryKeyValueStore();
    initPracticeSettings(store);
    initSession(store);
    resetCallCount = 0;
    if (dispose) {
      dispose();
    }
    dispose = setupSettingsResetWatcher(() => {
      resetCallCount++;
    });
  });

  it('resets session to idle and invokes callback when any practice setting changes', () => {
    startTest(1000);
    expect(phase.value).toBe('running');
    expect(resetCallCount).toBe(0);

    // 1. Script change
    setScript('katakana');
    expect(phase.value).toBe('idle');
    expect(resetCallCount).toBe(1);

    // 2. Content change
    startTest(1000);
    setContent('words');
    expect(phase.value).toBe('idle');
    expect(resetCallCount).toBe(2);

    // 3. Strictness change
    startTest(1000);
    setStrictness('ime');
    expect(phase.value).toBe('idle');
    expect(resetCallCount).toBe(3);

    // 4. Row toggle
    startTest(1000);
    toggleRow('k');
    expect(phase.value).toBe('idle');
    expect(resetCallCount).toBe(4);

    // 5. Weak focus toggle
    startTest(1000);
    setWeakFocus(false);
    expect(phase.value).toBe('idle');
    expect(resetCallCount).toBe(5);

    // 6. Test config change
    startTest(1000);
    setTestConfig({ kind: 'count', prompts: 50 });
    expect(phase.value).toBe('idle');
    expect(resetCallCount).toBe(6);
  });

  it('stops listening when disposed', () => {
    if (dispose) dispose();
    resetCallCount = 0;

    setScript('hiragana');
    expect(resetCallCount).toBe(0);
  });
});
