/**
 * Core i18next configuration for Tempot.
 *
 * Arabic (`ar`) is the primary language per Rule XXXIX (i18n-Only Rule).
 * English (`en`) serves as the fallback language.
 *
 * Language defaults can be overridden via environment variables:
 * - `TEMPOT_DEFAULT_LANGUAGE` — primary language (default: `'ar'`)
 * - `TEMPOT_FALLBACK_LANGUAGE` — fallback language (default: `'en'`)
 *
 * @example
 * ```typescript
 * import i18next from 'i18next';
 * import { i18nConfig } from '@tempot/i18n-core';
 *
 * await i18next.init(i18nConfig);
 * ```
 */
const DEFAULT_LANGUAGE = process.env.TEMPOT_DEFAULT_LANGUAGE ?? 'ar';
const FALLBACK_LANGUAGE = process.env.TEMPOT_FALLBACK_LANGUAGE ?? 'en';

export const i18nConfig = {
  lng: DEFAULT_LANGUAGE,
  fallbackLng: FALLBACK_LANGUAGE,
  supportedLngs: [DEFAULT_LANGUAGE, FALLBACK_LANGUAGE],
  interpolation: {
    escapeValue: false,
  },
};

export { DEFAULT_LANGUAGE, FALLBACK_LANGUAGE };
