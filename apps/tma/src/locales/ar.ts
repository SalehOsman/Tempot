export interface TmaLocaleDictionary {
  readonly botName: string;
  readonly settingsTitle: string;
  readonly closeButton: string;
  readonly languageTitle: string;
  readonly languageSubtitle: string;
  readonly themeTitle: string;
  readonly themeSubtitle: string;
  readonly themeDark: string;
  readonly themeLight: string;
  readonly langEn: string;
  readonly langAr: string;
  readonly activeBadge: string;
}

export const ar: TmaLocaleDictionary = {
  botName: 'Tembot',
  settingsTitle: 'الإعدادات',
  closeButton: 'إغلاق',
  languageTitle: 'اللغة',
  languageSubtitle: 'اختر لغة الواجهة المفضلة',
  themeTitle: 'المظهر',
  themeSubtitle: 'اختر بين المظهر الليلي والنهاري',
  themeDark: 'الوضع الليلي',
  themeLight: 'الوضع النهاري',
  langEn: 'English',
  langAr: 'العربية',
  activeBadge: 'مفعل',
};
