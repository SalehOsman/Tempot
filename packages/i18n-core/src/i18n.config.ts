/**
 * Core i18next configuration for Tempot.
 *
 * Arabic (`ar`) is the primary language per Rule XXXIX (i18n-Only Rule).
 * English (`en`) serves as the fallback language.
 *
 * @example
 * ```typescript
 * import i18next from 'i18next';
 * import { i18nConfig } from '@tempot/i18n-core';
 *
 * await i18next.init(i18nConfig);
 * ```
 */
export const i18nConfig = {
  lng: 'ar',
  fallbackLng: 'en',
  supportedLngs: ['ar', 'en'],
  interpolation: {
    escapeValue: false,
  },
};
