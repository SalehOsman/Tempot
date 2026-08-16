---
title: استخدام ناقل الأحداث (Event Bus Guide)
description: دليل عملي لنشر الأحداث، الاشتراك في المعالجات، وتكوين الموجه في تمبوت
tags:
  - guide
  - event-bus
  - architecture
audience:
  - package-developer
  - bot-developer
contentType: developer-docs
difficulty: intermediate
lastVerified: 2026-07-22
---

## نظرة عامة

توفر حزمة `@tempot/event-bus` آلية تواصل مفككة تماماً بين موديولات النظام عبر أحداث محددة بالأنواع البرمجية. يشرح هذا الدليل كيفية تهيئة الموجه، نشر الأحداث والاشتراك فيها، تعريف أحداث جديدة، وضبط مراقب الاتصال.

---

## تهيئة الموجه (`EventBusOrchestrator`)

يتم إنشاء وتهيئة الموجه عند إقلاع البوت:

```typescript
import { EventBusOrchestrator, type OrchestratorConfig } from '@tempot/event-bus';

const config: OrchestratorConfig = {
  redis: { connectionString: process.env.REDIS_URL! },
  logger: pinoLogger,
  shutdownManager,
};

const eventBus = new EventBusOrchestrator(config);
const initResult = await eventBus.init();
```

---

## نشر الأحداث (`publish`)

استخدم `publish()` مع اسم الحدث والبيانات المحددة بالأنواع:

```typescript
await eventBus.publish('storage.file.uploaded', {
  attachmentId: 'att_123',
  fileName: 'report.pdf',
  originalName: 'تقرير_المبيعات.pdf',
  mimeType: 'application/pdf',
  size: 204800,
  provider: 's3',
});
```

- **في حال توفر Redis:** يُنشر الحدث لجميع خوادم ونسخ البوت.
- **في حال تعطل Redis:** يتراجع تلقائياً للنشر المحلي في نفس السيرفر.

---

## الاشتراك في الأحداث (`subscribe`)

تسجيل دوال المعالجة عبر `subscribe()`:

```typescript
await eventBus.subscribe('storage.file.uploaded', (payload) => {
  // يفرض TypeScript مطابقة نوع البيانات تلقائياً
  console.log(`تم رفع الملف: ${payload.fileName}`);
});
```

---

## تعريف أحداث جديدة

أضف الحدث الجديد إلى واجهة `TempotEvents`:

```typescript
interface TempotEvents {
  'billing.invoice.created': {
    invoiceId: string;
    customerId: string;
    amount: number;
    currency: string;
  };
}
```

---

## مراقبة اتصال Redis

يقوم `ConnectionWatcher` بمراقبة اتصال Redis تلقائياً:
- يتطلب 5 استجابات `PING` متتالية ناجحة لتأكيد التعافي واستئناف النشر الموزع ومزامنة الاشتراكات المعلقة.
- فشل واحد يؤدي للتحول الفوري للنشر المحلي بدون تعليق طلبات المستخدمين.
