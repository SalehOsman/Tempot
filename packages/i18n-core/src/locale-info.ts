export function getLocaleInfo(lang: string): { lang: string; dir: 'rtl' | 'ltr' } {
  return {
    lang,
    dir: lang === 'ar' ? 'rtl' : 'ltr',
  };
}
