import type { Locale } from './locale';
import type { TranslationKey } from './en';
import { en } from './en';

export type Dictionary = Readonly<Record<TranslationKey, string>>;

// English is in the initial chunk; Russian is a chunk of its own, fetched when it is wanted.
const loaded = new Map<Locale, Dictionary>([['en', en]]);
const inflight = new Map<Locale, Promise<Dictionary>>();

/** The dictionary, if it has been loaded already. */
export function loadedDictionary(locale: Locale): Dictionary | undefined {
  return loaded.get(locale);
}

/** Loads the dictionary of a language once. A failure rejects, and a later call tries again. */
export function loadDictionary(locale: Locale): Promise<Dictionary> {
  const ready = loaded.get(locale);
  if (ready !== undefined) return Promise.resolve(ready);
  const pending = inflight.get(locale);
  if (pending !== undefined) return pending;

  const request = import('./ru')
    .then((module) => {
      loaded.set(locale, module.ru);
      return module.ru;
    })
    .finally(() => {
      inflight.delete(locale);
    });
  inflight.set(locale, request);
  return request;
}
