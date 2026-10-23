export interface CoreComponentsDictionary {
  readonly actions: {
    readonly confirm: string;
    readonly cancel: string;
    readonly close: string;
    readonly back: string;
  };
  readonly pagination: {
    readonly page: string;
    readonly total: string;
  };
}

export const ar: CoreComponentsDictionary = {
  actions: {
    confirm: '✅ تأكيد',
    cancel: '❌ إلغاء',
    close: '❌ إغلاق',
    back: '🔙 رجوع',
  },
  pagination: {
    page: 'صفحة',
    total: 'الإجمالي',
  },
};
