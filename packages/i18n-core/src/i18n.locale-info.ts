/** Languages with right-to-left script direction (ISO 639-1 codes). */
const RTL_LANGUAGES = new Set(['ar', 'he', 'fa', 'ur', 'ps', 'sd', 'yi', 'ku']);

/**
 * Returns locale metadata for the given language code.
 *
 * Provides the language code and its text directionality.
 * Uses a standard RTL language set rather than checking for a single language,
 * ensuring correct directionality if additional RTL languages are added.
 *
 * @param lang - BCP 47 language code (e.g. `'ar'`, `'en'`)
 * @returns Object with `lang` and `dir` properties
 *
 * @example
 * ```typescript
 * getLocaleInfo('ar'); // { lang: 'ar', dir: 'rtl' }
 * getLocaleInfo('en'); // { lang: 'en', dir: 'ltr' }
 * ```
 */
export function getLocaleInfo(lang: string): { lang: string; dir: 'rtl' | 'ltr' } {
  return {
    lang,
    dir: RTL_LANGUAGES.has(lang) ? 'rtl' : 'ltr',
  };
}
