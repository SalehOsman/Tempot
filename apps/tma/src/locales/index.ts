import { type TmaLocaleDictionary, ar } from './ar.js';
import { en } from './en.js';

export * from './ar.js';
export * from './en.js';

export function getTmaLocale(locale: 'ar' | 'en' | string = 'ar'): TmaLocaleDictionary {
  return locale === 'en' ? en : ar;
}
