import { ar, type SystemSettingsDictionary } from './ar.js';
import { en } from './en.js';

export * from './ar.js';
export * from './en.js';

export function getSystemSettingsLocale(locale: 'ar' | 'en' | string = 'ar'): SystemSettingsDictionary {
  return locale === 'en' ? en : ar;
}
