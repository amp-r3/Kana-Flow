import { effect } from '@preact/signals';
import { LocalStorageStore } from '@/shared/lib';
import { initLocale, locale, t } from '@/shared/i18n';
import { currentPath } from '@/shared/lib';
import { initSettings, flushSettings } from '@/entities/settings';
import { initProgress, flushProgress } from '@/entities/stats';
import type { KeyIntent } from '@/features/training';

export type { KeyIntent };

// The tab title follows the screen; `t()` reads the language, so it follows that too.
function routeTitle(path: string): string {
  switch (path) {
    case '/learn':
      return `${t('page.learn')} — ${t('app.title')}`;
    case '/stats':
      return `${t('page.stats')} — ${t('app.title')}`;
    case '/settings':
      return `${t('page.settings')} — ${t('app.title')}`;
    case '/about':
      return `${t('page.about')} — ${t('app.title')}`;
    default:
      return t('app.title');
  }
}

export function initApp(): void {
  const store = new LocalStorageStore();
  initLocale(store);
  initSettings(store);
  initProgress(store);

  // Sync documentElement.lang with active locale signal
  if (typeof document !== 'undefined') {
    effect(() => {
      document.documentElement.lang = locale.value;
    });

    effect(() => {
      document.title = routeTitle(currentPath.value);
    });
  }

  // Flush persistence on pagehide and visibilitychange (Plan 3.2 Rule 4 & Section 8)
  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', () => {
      flushSettings();
      flushProgress();
    });

    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        flushSettings();
        flushProgress();
      }
    });
  }
}
