export interface TmaLocaleDictionary {
  readonly botName: string;
  readonly settingsTitle: string;
  readonly preferencesHeader: string;
  readonly backButton: string;
  readonly closeButton: string;
  readonly languageTitle: string;
  readonly languageSubtitle: string;
  readonly themeTitle: string;
  readonly themeSubtitle: string;
  readonly themeDark: string;
  readonly themeLight: string;
  readonly langEn: string;
  readonly langAr: string;
}

export const ar: TmaLocaleDictionary = {
  botName: 'Tembot',
  settingsTitle: 'الإعدادات',
  preferencesHeader: 'التفضيلات',
  backButton: 'رجوع',
  closeButton: 'إغلاق',
  languageTitle: 'اللغة',
  languageSubtitle: 'اختر لغة واجهة التطبيق',
  themeTitle: 'المظهر',
  themeSubtitle: 'اختر النمط البصري المناسب',
  themeDark: 'داكن',
  themeLight: 'فاتح',
  langEn: 'English',
  langAr: 'العربية',
};
