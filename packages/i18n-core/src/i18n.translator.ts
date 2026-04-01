import i18next from 'i18next';
import { sessionContext } from '@tempot/shared';
import { DEFAULT_LANGUAGE } from './i18n.config.js';

/** Options passed to the `t()` translation function. */
export interface TranslationOptions {
  /** Pluralization count. */
  count?: number;
  /** Fallback value if key is not found. */
  defaultValue?: string;
  /** Context suffix for gender/mode variants. */
  context?: string;
  /** Additional interpolation variables. */
  [key: string]: unknown;
}

/**
 * Context-aware translation function.
 *
 * Reads the current user's language from `sessionContext` (AsyncLocalStorage)
 * and delegates to i18next. Falls back to `DEFAULT_LANGUAGE` (from env var
 * `TEMPOT_DEFAULT_LANGUAGE`, default `'ar'`) when no session is available or
 * the stored language is not a string.
 *
 * i18n-core is core infrastructure exempt from Rule XVI (ADR-033).
 * This function is always available.
 *
 * @param key - Translation key or array of keys (first match wins)
 * @param options - Interpolation variables, pluralization count, etc.
 * @returns The translated string, or the key name if no translation exists
 */
export function t(key: string | string[], options?: TranslationOptions): string {
  const store = sessionContext.getStore();
  const rawLang = store?.locale;
  const lang: string = typeof rawLang === 'string' ? rawLang : DEFAULT_LANGUAGE;

  return i18next.t(key, { ...options, lng: lang });
}
