import { type DashboardLocaleDictionary, ar } from './ar.js';
import { en } from './en.js';

export * from './ar.js';
export * from './en.js';

export function getDashboardLocale(locale: 'ar' | 'en' | string = 'ar'): DashboardLocaleDictionary {
  return locale === 'en' ? en : ar;
}
