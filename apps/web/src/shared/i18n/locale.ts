import type { ReadonlySignal } from '@preact/signals';
import { batch, signal } from '@preact/signals';
import type { KeyValueStore } from '@/shared/lib';
import { STORAGE_KEYS } from '@/shared/lib';
import type { Dictionary } from './dictionary';
import { loadDictionary, loadedDictionary } from './dictionary';
import { en } from './en';

export type Locale = 'en' | 'ru';

function detectLocale(): Locale {
  if (typeof navigator !== 'undefined' && navigator.language) {
    if (navigator.language.toLowerCase().startsWith('ru')) {
      return 'ru';
    }
  }
  return 'en';
}

// The language and its dictionary change together, and only once the dictionary is there: the
// interface is never shown in a language whose strings have not arrived.
const _locale = signal<Locale>('en');
const _dictionary = signal<Dictionary>(en);
export const locale: ReadonlySignal<Locale> = _locale;
export const dictionary: ReadonlySignal<Dictionary> = _dictionary;

// The store bound at startup, so components change the language without touching storage.
let boundStore: KeyValueStore | undefined;

function apply(newLocale: Locale, words: Dictionary): void {
  batch(() => {
    _dictionary.value = words;
    _locale.value = newLocale;
  });
}

// Numbers the switches, so a dictionary that arrives after a later choice does not undo it.
let latestSwitch = 0;

/**
 * Switches to a language once its dictionary is loaded. False if it could not be loaded, or if
 * another switch was asked for in the meantime: the last choice wins.
 */
async function switchTo(newLocale: Locale): Promise<boolean> {
  latestSwitch += 1;
  const request = latestSwitch;
  const ready = loadedDictionary(newLocale);
  if (ready !== undefined) {
    apply(newLocale, ready);
    return true;
  }
  try {
    const words = await loadDictionary(newLocale);
    if (request !== latestSwitch) return false;
    apply(newLocale, words);
    return true;
  } catch {
    return false;
  }
}

/**
 * Binds the store and applies the saved language, or the browser's. Resolves when the dictionary is
 * in; if it cannot be loaded the interface stays in English and the saved choice is kept.
 */
export async function initLocale(store: KeyValueStore): Promise<void> {
  boundStore = store;
  const persisted = store.get(STORAGE_KEYS.LOCALE);
  await switchTo(persisted === 'en' || persisted === 'ru' ? persisted : detectLocale());
}

/** Changes the language after loading its dictionary; the choice is saved only then. */
export async function setLocale(
  newLocale: Locale,
  store: KeyValueStore | undefined = boundStore,
): Promise<boolean> {
  const switched = await switchTo(newLocale);
  if (switched && store) {
    store.set(STORAGE_KEYS.LOCALE, newLocale);
  }
  return switched;
}

/** Fetches a dictionary ahead of time, so the language can be switched without the network. */
export function preloadLocale(wanted: Locale): Promise<unknown> {
  return loadDictionary(wanted);
}
