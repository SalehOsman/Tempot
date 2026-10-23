export interface DashboardLocaleDictionary {
  readonly defaults: {
    readonly welcomeMessage: string;
  };
  readonly health: {
    readonly checking: string;
    readonly online: string;
    readonly offline: string;
    readonly standalone: string;
    readonly label: string;
  };
  readonly header: {
    readonly title: string;
    readonly subtitle: string;
  };
  readonly tabs: {
    readonly settings: string;
    readonly roles: string;
  };
  readonly settingsForm: {
    readonly title: string;
    readonly savedSuccess: string;
    readonly botSectionTitle: string;
    readonly botNameLabel: string;
    readonly botWelcomeLabel: string;
    readonly botMaintCheckbox: string;
    readonly tmaSectionTitle: string;
    readonly tmaTitleLabel: string;
    readonly tmaColorLabel: string;
    readonly tmaMaintCheckbox: string;
    readonly submitButton: string;
  };
  readonly rolesMatrix: {
    readonly title: string;
    readonly subtitle: string;
    readonly thRole: string;
    readonly thDesc: string;
    readonly thCaps: string;
    readonly superAdminDesc: string;
    readonly superAdminCaps: string;
    readonly opsManagerDesc: string;
    readonly auditorDesc: string;
    readonly endUserDesc: string;
  };
}

export const ar: DashboardLocaleDictionary = {
  defaults: {
    welcomeMessage: 'مرحباً بك في البوت السيادي! كيف يمكنني خدمتك اليوم؟',
  },
  health: {
    checking: 'جاري الفحص...',
    online: 'متصل ونشط 🟢',
    offline: 'غير متصل (الخادم متوقف) 🔴',
    standalone: 'محلي (وضع المعاينة المستقل)',
    label: 'حالة الخادم:',
  },
  header: {
    title: '⚙️ لوحة التحكم السيادية | Tembot Admin',
    subtitle: 'إدارة الأسطح الثلاثية والصلاحيات وحوكمة المنصة',
  },
  tabs: {
    settings: '⚙️ إعدادات الأسطح الثلاثية',
    roles: '🛡️ الصلاحيات ومحرك ctx.can',
  },
  settingsForm: {
    title: 'تخصيص أسطح التليجرام والميني اب ولوحة التحكم',
    savedSuccess: '✓ تم حفظ الإعدادات وتحديث الكاش الموزع بنجاح!',
    botSectionTitle: '🤖 سطح بوت التليجرام (Telegram Bot Surface)',
    botNameLabel: 'اسم البوت:',
    botWelcomeLabel: 'نص الترحيب في /start:',
    botMaintCheckbox: 'تفعيل وضع الصيانة للبوت (إغلاق استقبال الطلبات مؤقتاً)',
    tmaSectionTitle: '📱 سطح تطبيق التليجرام المصغر (TMA Surface)',
    tmaTitleLabel: 'عنوان تطبيق الميني اب:',
    tmaColorLabel: 'اللون الرئيسي للتطبيق:',
    tmaMaintCheckbox: 'تفعيل وضع الصيانة للميني اب',
    submitButton: '💾 حفظ التعديلات ونشر الإبطال',
  },
  rolesMatrix: {
    title: 'مصفوفة الصلاحيات الهجينة (Hybrid RBCA)',
    subtitle:
      'الكود البرمجي يتحقق حصراً من الصلاحيات الذرية عبر ctx.can دون أي ارتباط صلب بمسميات الأدوار.',
    thRole: 'الدور القياسي',
    thDesc: 'الوصف',
    thCaps: 'الصلاحيات الممنوحة',
    superAdminDesc: 'المالك وصلاحيات الطوارئ',
    superAdminCaps: '* (كافة الصلاحيات بلا قيد)',
    opsManagerDesc: 'مدير العمليات والإعدادات',
    auditorDesc: 'التدقيق الجنائي والامتثال',
    endUserDesc: 'مستخدم البوت والميني اب',
  },
};
