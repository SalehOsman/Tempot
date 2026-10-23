import { type BotLocaleDictionary, ar } from './ar.js';
import { en } from './en.js';

export * from './ar.js';
export * from './en.js';

export function getBotLocale(locale: 'ar' | 'en' | string = 'ar'): BotLocaleDictionary {
  return locale === 'en' ? en : ar;
}
