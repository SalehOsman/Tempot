/**
 * Returns locale metadata for the given language code.
 *
 * Provides the language code and its text directionality (`rtl` for Arabic,
 * `ltr` for all other languages). Used by UI components to set layout direction.
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
    dir: lang === 'ar' ? 'rtl' : 'ltr',
  };
}
