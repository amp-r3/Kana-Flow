import { describe, it, expect } from 'vitest';
import { en, ru, t, locale, setLocale } from './index';
import { MemoryKeyValueStore } from '@/shared/lib';

describe('i18n: translations and locale handling', () => {
  it('ru keys strictly match en keys (tested via compile-time satisfies and runtime equality)', () => {
    const enKeys = Object.keys(en).sort();
    const ruKeys = Object.keys(ru).sort();
    expect(ruKeys).toEqual(enKeys);
    expect(enKeys.length).toBeGreaterThan(0);
  });

  it('translates strings for active locale with parameter interpolation', () => {
    setLocale('en');
    expect(t('app.title')).toBe('Kana Flow');
    expect(t('stage.revealed', { answer: 'ka' })).toBe('Revealed: ka');

    setLocale('ru');
    expect(t('app.title')).toBe('Kana Flow');
    expect(t('config.script.hiragana')).toBe('Хирагана');
    expect(t('stage.revealed', { answer: 'ka' })).toBe('Ответ: ka');

    // Reset back to en
    setLocale('en');
  });

  it('setLocale persists locale to store and updates locale signal', () => {
    const store = new MemoryKeyValueStore();
    setLocale('ru', store);
    expect(store.get('kanaflow:locale')).toBe('ru');
    expect(locale.value).toBe('ru');

    setLocale('en', store);
    expect(store.get('kanaflow:locale')).toBe('en');
    expect(locale.value).toBe('en');
  });
});
