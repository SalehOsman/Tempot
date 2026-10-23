export interface BotLocaleDictionary {
  readonly greeting: {
    readonly defaultWelcome: string;
    readonly guideHint: string;
    readonly openTmaDirectPrompt: string;
    readonly openTmaInlineButton: string;
  };
  readonly tma: {
    readonly buttonHears: readonly string[];
    readonly readyTitle: string;
    readonly openNowInlineButton: string;
    readonly directOpenInstruction: string;
    readonly httpsRequiredTitle: string;
    readonly httpsRequiredBody: string;
    readonly localPreviewLabel: string;
    readonly productionTip: string;
  };
  readonly settings: {
    readonly buttonHears: readonly string[];
    readonly initializing: string;
    readonly openFailed: string;
    readonly callbackInitializing: string;
  };
}

export const ar: BotLocaleDictionary = {
  greeting: {
    defaultWelcome: 'مرحباً بك في منصة تيمبوت السيادية!',
    guideHint: 'استخدم القائمة أدناه أو زر ⚙️ الإعدادات للتحكم.',
    openTmaDirectPrompt: '📱 يمكنك فتح الميني اب مباشرة عبر هذا الزر:',
    openTmaInlineButton: '🚀 فتح الميني اب داخل التليجرام',
  },
  tma: {
    buttonHears: ['🚀 فتح التطبيق', 'فتح التطبيق'],
    readyTitle: '📱 <b>تطبيق التليجرام المصغر (TMA) جاهز!</b>',
    openNowInlineButton: '🚀 اضغط هنا لفتح الميني اب الآن',
    directOpenInstruction: 'اضغط على الزر أدناه لفتح واجهة التطبيق مباشرة داخل التليجرام:',
    httpsRequiredTitle: '📱 <b>تطبيق التليجرام المصغر (TMA)</b>',
    httpsRequiredBody:
      'يشترط تيليجرام رابطاً آمناً <b>HTTPS</b> لفتح النوافذ المنبثقة مباشرة داخل التطبيق.',
    localPreviewLabel: '🔗 <b>رابط المعاينة المحلية بالمتصفح:</b>',
    productionTip:
      '💡 <i>عند رفع المنصة لسيرفر أو تشغيل نفق محلي (ngrok/cloudflared)، ضع الرابط في متغير TMA_URL وسيفتح داخل التليجرام بضغطة زر.</i>',
  },
  settings: {
    buttonHears: ['⚙️ الإعدادات', 'الإعدادات', '/settings'],
    initializing: '⚙️ نظام الإعدادات قيد التهيئة...',
    openFailed: 'تعذر فتح قائمة الإعدادات حالياً.',
    callbackInitializing: 'النظام قيد التهيئة',
  },
};
