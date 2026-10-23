import { ar, type CoreComponentsDictionary } from './ar.js';
import { en } from './en.js';

export * from './ar.js';
export * from './en.js';

export function getCoreComponentsLocale(locale: 'ar' | 'en' | string = 'ar'): CoreComponentsDictionary {
  return locale === 'en' ? en : ar;
}
