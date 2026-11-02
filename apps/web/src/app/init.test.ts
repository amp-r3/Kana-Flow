// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryKeyValueStore, STORAGE_KEYS } from '@/shared/lib';
import { initLocale, locale, setLocale } from '@/shared/i18n';
import { initApp } from './init';

describe('app/init', () => {
  beforeEach(() => {
    document.documentElement.lang = 'en';
  });

  it('setLocale persists and sets the lang attribute (in app/init)', () => {
    const store = new MemoryKeyValueStore();
    initLocale(store);
    initApp();

    expect(document.documentElement.lang).toBe('en');

    setLocale('ru', store);
    expect(locale.value).toBe('ru');
    expect(document.documentElement.lang).toBe('ru');
    expect(store.get(STORAGE_KEYS.LOCALE)).toBe('ru');

    // Setting back to en
    setLocale('en', store);
    expect(locale.value).toBe('en');
    expect(document.documentElement.lang).toBe('en');
    expect(store.get(STORAGE_KEYS.LOCALE)).toBe('en');
  });
});
