import { locale } from './locale';
import { en, type TranslationKey } from './en';
import { ru } from './ru';

export function t(
  key: TranslationKey,
  params?: Record<string, string | number>,
): string {
  const currentLocale = locale.value;
  const dict = currentLocale === 'ru' ? ru : en;
  let str: string = dict[key];

  if (params) {
    for (const [pKey, pVal] of Object.entries(params)) {
      str = str.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
    }
  }

  return str;
}
