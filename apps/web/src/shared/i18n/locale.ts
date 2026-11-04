import type { ReadonlySignal } from '@preact/signals';
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

const _locale = signal<Locale>(detectLocale());
export const locale: ReadonlySignal<Locale> = _locale;

// The store bound at startup, so components change the language without touching storage.
let boundStore: KeyValueStore | undefined;

export function initLocale(store: KeyValueStore): void {
  boundStore = store;
  const persisted = store.get(STORAGE_KEYS.LOCALE);
  if (persisted === 'en' || persisted === 'ru') {
    _locale.value = persisted;
  }
}

export function setLocale(newLocale: Locale, store: KeyValueStore | undefined = boundStore): void {
  _locale.value = newLocale;
  if (store) {
    store.set(STORAGE_KEYS.LOCALE, newLocale);
  }
}
