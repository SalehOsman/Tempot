export interface SystemSettingsDictionary {
  readonly replyKeyboard: {
    readonly tmaButton: string;
    readonly settingsButton: string;
  };
  readonly mainPage: {
    readonly title: string;
    readonly platformName: string;
    readonly defaultLocale: string;
    readonly botSurface: string;
    readonly tmaSurface: string;
    readonly globalStatus: string;
    readonly brandColor: string;
    readonly statusActive: string;
    readonly statusMaintenance: string;
    readonly statusSuspended: string;
    readonly changeLocaleButton: string;
    readonly maintenanceButton: string;
    readonly closeButton: string;
    readonly footerHint: string;
    readonly localeArabic: string;
    readonly localeEnglish: string;
  };
  readonly localeSelection: {
    readonly title: string;
    readonly currentLocaleIntro: string;
    readonly choosePrompt: string;
    readonly arabicOption: string;
    readonly englishOption: string;
    readonly backButton: string;
  };
  readonly maintenance: {
    readonly title: string;
    readonly bodyIntro: string;
    readonly botLabel: string;
    readonly tmaLabel: string;
    readonly globalLabel: string;
    readonly activeState: string;
    readonly disabledState: string;
    readonly toggleBotButton: string;
    readonly toggleTmaButton: string;
    readonly toggleGlobalButton: string;
    readonly backButton: string;
    readonly confirmTitle: string;
    readonly confirmIntro: string;
    readonly targetSurfaceIntro: string;
    readonly warningNote: string;
    readonly botSurfaceName: string;
    readonly tmaSurfaceName: string;
    readonly globalSurfaceName: string;
    readonly enableAction: string;
    readonly disableAction: string;
  };
  readonly defaults: {
    readonly welcomeMessage: string;
    readonly helpMessage: string;
  };
}

export const ar: SystemSettingsDictionary = {
  replyKeyboard: {
    tmaButton: '🚀 فتح التطبيق',
    settingsButton: '⚙️ الإعدادات',
  },
  mainPage: {
    title: 'إعدادات النظام والأسطح الثلاثية',
    platformName: 'اسم المنصة',
    defaultLocale: 'اللغة الافتراضية',
    botSurface: 'سطح البوت',
    tmaSurface: 'سطح الميني اب',
    globalStatus: 'الحالة العامة',
    brandColor: 'لون الهوية (TMA)',
    statusActive: '🟢 يعمل بنشاط',
    statusMaintenance: '🛑 وضع الصيانة',
    statusSuspended: '🛑 صيانة شاملة',
    changeLocaleButton: '🌐 تغيير اللغة',
    maintenanceButton: '🛡️ وضع الصيانة',
    closeButton: '❌ إغلاق القائمة',
    footerHint: 'اختر أحد الخيارات لتعديل الإعدادات فورياً',
    localeArabic: 'العربية (Arabic)',
    localeEnglish: 'الإنجليزية (English)',
  },
  localeSelection: {
    title: 'اختيار لغة النظام',
    currentLocaleIntro: 'اللغة الحالية هي',
    choosePrompt: 'اختر اللغة المطلوبة لتطبيقها فورياً على جميع واجهات المنصة:',
    arabicOption: '🇸🇦 العربية',
    englishOption: '🇬🇧 English',
    backButton: '🔙 عودة',
  },
  maintenance: {
    title: 'إدارة أوضاع الصيانة',
    bodyIntro: 'يمكنك التحكم في وضع الصيانة لكل سطح بشكل مستقل، أو إيقاف المنصة بالكامل:',
    botLabel: 'البوت',
    tmaLabel: 'الميني اب',
    globalLabel: 'المنصة ككل',
    activeState: '🟢 مفعل',
    disabledState: '🛑 معطل',
    toggleBotButton: '🤖 تبديل البوت',
    toggleTmaButton: '📱 تبديل TMA',
    toggleGlobalButton: '🛡️ صيانة شاملة',
    backButton: '🔙 عودة للرئيسية',
    confirmTitle: 'تأكيد تبديل وضع الصيانة',
    confirmIntro: 'أنت على وشك',
    targetSurfaceIntro: 'السطح المستهدف',
    warningNote: '⚠️ <i>سيتم تقييد وصول المستخدمين العاديين فور تأكيد هذا الإجراء.</i>',
    botSurfaceName: 'سطح البوت',
    tmaSurfaceName: 'سطح الميني اب',
    globalSurfaceName: 'المنصة بالكامل',
    enableAction: 'تفعيل وضع الصيانة',
    disableAction: 'إلغاء وضع الصيانة وتشغيل السطح',
  },
  defaults: {
    welcomeMessage: 'مرحباً بك في المنصة!',
    helpMessage: 'قائمة الأوامر المتاحة:...',
  },
};
