import { effect } from '@preact/signals';
import { LocalStorageStore } from '@/shared/lib';
import { initLocale, locale } from '@/shared/i18n';
import { initPracticeSettings, flushPracticeSettings } from '@/entities/kana';
import { initSession } from '@/entities/session';
import { initProgress, flushProgress } from '@/entities/progress';
import type { KeyIntent } from '@/features/type-prompt';

export type { KeyIntent };

export function initApp(): void {
  const store = new LocalStorageStore();
  initLocale(store);
  initPracticeSettings(store);
  initSession(store);
  initProgress(store);

  // Sync documentElement.lang with active locale signal
  if (typeof document !== 'undefined') {
    effect(() => {
      document.documentElement.lang = locale.value;
    });
  }

  // Flush persistence on pagehide and visibilitychange (Plan 3.2 Rule 4 & Section 8)
  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', () => {
      flushPracticeSettings();
      flushProgress();
    });

    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        flushPracticeSettings();
        flushProgress();
      }
    });
  }
}
