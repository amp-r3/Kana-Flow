import { describe, it, expect } from 'vitest';
import { locale, setLocale } from './index';
import { MemoryKeyValueStore, STORAGE_KEYS } from '@/shared/lib';

// The Russian dictionary is not loaded yet in this file: a switch to it waits for its chunk.
describe('locale: switching while a dictionary loads', () => {
  it('the last choice wins: a dictionary that arrives late does not switch the language back', async () => {
    const store = new MemoryKeyValueStore();
    const toRussian = setLocale('ru', store);
    const toEnglish = setLocale('en', store);
    await Promise.all([toRussian, toEnglish]);

    expect(locale.value).toBe('en');
    expect(store.get(STORAGE_KEYS.LOCALE)).toBe('en');
    // The superseded switch reports that it did not happen.
    expect(await toRussian).toBe(false);
  });
});
