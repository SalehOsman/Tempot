---
title: بناء التواصل الموجه بالأحداث (Event-Driven Tutorial)
description: درس تعليمي خطوة بخطوة لبناء تواصل مفكك بين الموديولات باستخدام ناقل الأحداث في تمبوت
tags:
  - tutorial
  - event-bus
  - architecture
audience:
  - bot-developer
contentType: developer-docs
difficulty: beginner
lastVerified: 2026-07-22
---

## المتطلبات الأساسية

- بيئة تمبوت تعمل محلياً.
- تشغيل خادم Redis.
- فهم أساسيات نمط النتيجة (`Result`) في حزمة `@tempot/shared`.

---

## ربط موديول الطلبات بموديول الإشعارات

في هذا الدرس ستصل بين موديولين (موديول الطلبات ينشر الأحداث وموديول الإشعارات يستمع إليها) دون أي استيراد مباشر بينهما.

### الخطوة 1: تهيئة ناقل الأحداث

```typescript
import { EventBusOrchestrator, type OrchestratorConfig } from '@tempot/event-bus';
import { ShutdownManager } from '@tempot/shared';

const shutdownManager = new ShutdownManager(logger);
const config: OrchestratorConfig = {
  redis: { connectionString: 'redis://localhost:6379' },
  logger,
  shutdownManager,
};

const eventBus = new EventBusOrchestrator(config);
await eventBus.init();
```

---

### الخطوة 2: الاشتراك في الأحداث (في موديول الإشعارات)

اشترك دائماً قبل النشر:

```typescript
await eventBus.subscribe('orders.order.completed', (payload) => {
  console.log(`تم استلام إشعار اكتمال الطلب: ${payload.orderId}`);
});
```

---

### الخطوة 3: نشر الأحداث (في موديول الطلبات)

```typescript
async function completeOrder(orderId: string) {
  // ... منطق إكمال الطلب ...

  const publishResult = await eventBus.publish('orders.order.completed', {
    orderId,
    totalAmount: 1500,
    timestamp: new Date().toISOString(),
  });
}
```

---

### الخطوة 4: عزل الأخطاء وتعدد المستمعين

يمكن لعدة موديولات الاستماع لنفس الحدث دون تداخل:
- فشل أحد المستمعين لا يؤثر على المستمعين الآخرين ولا يعطل موديول الطلبات الأصلي.

---

### الخطوة 5: الإغلاق الآمن (Graceful Shutdown)

```typescript
process.on('SIGTERM', async () => {
  await shutdownManager.execute();
});
```
