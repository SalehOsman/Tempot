---
title: حزمة ناقل الأحداث (Event Bus Package)
description: فهم معمارية الأحداث ثلاثية المستويات، والتوجيه الذكي، والتراجع التلقائي عند انقطاع الاتصال في تمبوت
tags:
  - concepts
  - event-bus
  - architecture
audience:
  - package-developer
  - bot-developer
contentType: developer-docs
difficulty: intermediate
lastVerified: 2026-07-22
---

## ما هو ناقل الأحداث؟

توفر حزمة `@tempot/event-bus` آلية تواصل مفككة تماماً بين موديولات النظام (Decoupled Inter-module Communication). لا تقوم الموديولات باستدعاء بعضها مباشرة، بل تمر كافة عمليات التواصل عبر أحداث محددة بالأنواع البرمجية (Typed Events).

---

## معمارية المستويات الثلاثة (Three-Level Architecture)

يدعم ناقل الأحداث 3 مستويات لنشر واستقبال الأحداث:

| المستوى | وسيلة النقل | النطاق |
|---|---|---|
| `LOCAL` | Node.js EventEmitter | نفس العملية داخل السيرفر |
| `INTERNAL` | Node.js EventEmitter | نفس العملية (مدمج مع LOCAL حالياً) |
| `EXTERNAL` | Redis Pub/Sub | موزع عبر جميع نسخ وخوادم البوت |

---

## الموجه الرئيسي (`EventBusOrchestrator`)

فئة `EventBusOrchestrator` هي الواجهة البرمجية الموحدة للمطورين، وتجمع بين `LocalEventBus` و `RedisEventBus` و `ConnectionWatcher`:

- **عند توفر Redis:** يتم توجيه النشر عبر `RedisEventBus` للنشر الموزع.
- **عند تعطل أو انقطاع Redis:** يتحول النشر تلقائياً ودون توقف النظام إلى `LocalEventBus` في نفس السيرفر.
- **إعادة الاتصال:** يقوم النظام بمزامنة الاشتراكات المعلقة فور استعادة اتصال Redis.

---

## معيار تسمية الأحداث (Event Naming Convention)

يجب أن تتبع كافة أسماء الأحداث نمط `{module}.{entity}.{action}` وتخضع لفحص التعبير النمطي الصارم:

- `user-management.user.started`
- `backup.job.requested`
- `storage.file.uploaded`

---

## سجل الأحداث المكتوب بالأنواع (`TempotEvents`)

توفر واجهة `TempotEvents` تعريفاً مركزياً لكافة أحداث النظام ومحتوى بياناتها:

```typescript
interface TempotEvents {
  'storage.file.uploaded': {
    attachmentId: string;
    fileName: string;
    mimeType: string;
    size: number;
    provider: string;
  };
  'backup.job.requested': {
    jobId: string;
    requestedBy: string;
  };
}
```

---

## مراقبة الاتصال وعزل المستمعين (Connection Watcher & Listener Isolation)

- **استقرار الاتصال:** يتطلب Redis 5 استجابات متتالية ناجحة لأمر `PING` لاعتباره مستقراً، بينما يؤدي فشل واحد إلى التحول المحلي الفوري لمنع التردد (Flapping).
- **عزل الأخطاء:** يعمل كل مستمع للحدث في نطاق `try/catch` معزول؛ فشل مستمع معين لا يمنع باقي المستمعين ولا يكسر العملية لدى الناشر.
