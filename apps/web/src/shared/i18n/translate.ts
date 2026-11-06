import { dictionary } from './locale';
import type { TranslationKey } from './en';

export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  let str: string = dictionary.value[key];

  if (params) {
    for (const [pKey, pVal] of Object.entries(params)) {
      str = str.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
    }
  }

  return str;
}
