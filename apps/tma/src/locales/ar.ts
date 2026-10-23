export interface TmaLocaleDictionary {
  readonly botName: string;
  readonly homeTitle: string;
  readonly homeSubtitle: string;
  readonly systemReady: string;
  readonly openSettings: string;
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
  homeTitle: 'مرحباً بك في Tembot',
  homeSubtitle: 'المساعد الذكي المستقل جاهز لخدمتك',
  systemReady: 'متصل وجاهز',
  openSettings: 'فتح الإعدادات',
  settingsTitle: 'الإعدادات',
  preferencesHeader: 'التفضيلات العامة',
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
