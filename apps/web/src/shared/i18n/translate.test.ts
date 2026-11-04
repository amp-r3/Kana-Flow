import { describe, it, expect } from 'vitest';
import { en, ru, t, locale, setLocale, initLocale } from './index';
import { MemoryKeyValueStore, STORAGE_KEYS } from '@/shared/lib';

// Compile-time verification: ru satisfies Record<keyof typeof en, string>
type _RuEnCompileTimeParity = typeof ru extends Record<keyof typeof en, string> ? true : false;
type _AssertParity<T extends true> = T;
export type _CheckedRuEnParity = _AssertParity<_RuEnCompileTimeParity>;

describe('i18n: translations and locale handling', () => {
  it('has exact runtime key parity between en and ru dictionaries', () => {
    const enKeys = Object.keys(en).sort();
    const ruKeys = Object.keys(ru).sort();
    expect(ruKeys).toEqual(enKeys);
    expect(enKeys.length).toBeGreaterThan(0);

    const enValues = Object.values(en);
    const ruValues = Object.values(ru);
    for (const val of enValues) {
      expect(val.length).toBeGreaterThan(0);
    }
    for (const val of ruValues) {
      expect(val.length).toBeGreaterThan(0);
    }
  });

  it('translates strings for active locale with parameter interpolation', () => {
    setLocale('en');
    expect(t('app.title')).toBe('Nekotype');
    expect(t('stage.revealed', { answer: 'ka' })).toBe('Revealed: ka');

    setLocale('ru');
    expect(t('app.title')).toBe('Nekotype');
    expect(t('config.script.hiragana')).toBe('Хирагана');
    expect(t('stage.revealed', { answer: 'ka' })).toBe('Ответ: ka');

    // Reset back to en
    setLocale('en');
  });

  it('setLocale without a store persists to the store bound by initLocale', () => {
    const store = new MemoryKeyValueStore();
    initLocale(store);
    setLocale('ru');
    expect(store.get(STORAGE_KEYS.LOCALE)).toBe('ru');
    setLocale('en');
    expect(store.get(STORAGE_KEYS.LOCALE)).toBe('en');
  });

  it('setLocale persists locale to store and updates locale signal', () => {
    const store = new MemoryKeyValueStore();
    setLocale('ru', store);
    expect(store.get('nekotype:locale')).toBe('ru');
    expect(locale.value).toBe('ru');

    setLocale('en', store);
    expect(store.get('nekotype:locale')).toBe('en');
    expect(locale.value).toBe('en');
  });
});
