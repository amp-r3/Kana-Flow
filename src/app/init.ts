import { effect } from '@preact/signals';
import { LocalStorageStore } from '@/shared/lib';
import { initLocale, locale } from '@/shared/i18n';
import { initPracticeSettings } from '@/entities/kana';
import { initSession } from '@/entities/session';
import { initProgress } from '@/entities/progress';

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
}
