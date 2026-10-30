import { signal } from '@preact/signals';
import type { KeyValueStore } from '@/shared/lib';
import { STORAGE_KEYS } from '@/shared/lib';

export type Locale = 'en' | 'ru';

function detectLocale(): Locale {
  if (typeof navigator !== 'undefined' && navigator.language) {
    if (navigator.language.toLowerCase().startsWith('ru')) {
      return 'ru';
    }
  }
  return 'en';
}

export const locale = signal<Locale>(detectLocale());

export function initLocale(store: KeyValueStore): void {
  const persisted = store.get(STORAGE_KEYS.LOCALE);
  if (persisted === 'en' || persisted === 'ru') {
    locale.value = persisted;
  }
}

export function setLocale(newLocale: Locale, store?: KeyValueStore): void {
  locale.value = newLocale;
  if (store) {
    store.set(STORAGE_KEYS.LOCALE, newLocale);
  }
}
