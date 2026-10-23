export interface TmaLocaleDictionary {
  readonly auth: {
    readonly verifying: string;
    readonly verified: string;
    readonly failed: string;
    readonly offlinePreview: string;
    readonly browserDev: string;
    readonly browserPreview: string;
    readonly mockUserName: string;
    readonly statusLabel: string;
  };
  readonly header: {
    readonly title: string;
    readonly subtitle: string;
  };
  readonly userCard: {
    readonly title: string;
    readonly nameLabel: string;
    readonly idLabel: string;
    readonly usernameLabel: string;
    readonly langLabel: string;
  };
  readonly environment: {
    readonly title: string;
    readonly currentEnvLabel: string;
    readonly envTelegram: string;
    readonly envBrowser: string;
    readonly gatewayConnectionLabel: string;
    readonly connectedPort: string;
    readonly localMode: string;
    readonly capabilityEngineLabel: string;
    readonly activeStatus: string;
  };
}

export const ar: TmaLocaleDictionary = {
  auth: {
    verifying: 'جاري التحقق التشفيري...',
    verified: 'موثق تشفيرياً عبر HMAC-SHA256 🛡️',
    failed: 'فشل التحقق من التوقيع التشفيري ⚠️',
    offlinePreview: 'وضع المعاينة المحلي (الخادم غير متصل)',
    browserDev: 'وضع التطوير خارج التليجرام (Browser Standalone)',
    browserPreview: 'وضع المعاينة (خارج بيئة التليجرام)',
    mockUserName: 'مطور تجريبي',
    statusLabel: 'حالة الأمان:',
  },
  header: {
    title: 'تطبيق التليجرام المصغر (TMA)',
    subtitle: 'Tembot Sovereign Telegram Mini App',
  },
  userCard: {
    title: '👤 بيانات المستخدم الموثقة:',
    nameLabel: 'الاسم:',
    idLabel: 'المعرف (ID):',
    usernameLabel: 'اسم المستخدم:',
    langLabel: 'لغة الواجهة:',
  },
  environment: {
    title: '⚙️ مواصفات السطح المشغل:',
    currentEnvLabel: 'البيئة الحالية:',
    envTelegram: 'داخل التليجرام (Telegram WebApp)',
    envBrowser: 'متصفح ويب خارجي',
    gatewayConnectionLabel: 'اتصال البوابة:',
    connectedPort: 'متصل بالبوابة',
    localMode: 'محلي',
    capabilityEngineLabel: 'محرك الصلاحيات:',
    activeStatus: 'نشط',
  },
};
