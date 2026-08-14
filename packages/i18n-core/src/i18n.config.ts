/**
 * Core i18next configuration for Tempot.
 *
 * Arabic (`ar`) is the primary language per Rule XXXIX (i18n-Only Rule).
 * English (`en`) serves as the fallback language.
 *
 * Language defaults can be overridden via environment variables:
 * - `TEMPOT_DEFAULT_LANGUAGE` — primary language (default: `'ar'`)
 * - `TEMPOT_FALLBACK_LANGUAGE` — fallback language (default: `'en'`)
 */
import i18next from 'i18next';

export const DEFAULT_LANGUAGE = process.env.TEMPOT_DEFAULT_LANGUAGE ?? 'ar';
export const FALLBACK_LANGUAGE = process.env.TEMPOT_FALLBACK_LANGUAGE ?? 'en';

export const i18nConfig = {
  lng: DEFAULT_LANGUAGE,
  fallbackLng: FALLBACK_LANGUAGE,
  supportedLngs: [DEFAULT_LANGUAGE, FALLBACK_LANGUAGE],
  interpolation: {
    escapeValue: false,
  },
};

/**
 * Initialize i18next with the Tempot language configuration.
 *
 * Must be called once before any `t()` or `loadModuleLocales()` calls.
 * Idempotent — safe to call multiple times.
 */
export async function initI18n(): Promise<void> {
  if (!i18next.isInitialized) {
    await i18next.init(i18nConfig);
  }
}
