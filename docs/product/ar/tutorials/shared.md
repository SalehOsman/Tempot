---
title: بناء خدمة باستخدام الحزمة المشتركة (Shared Tutorial)
description: درس تعليمي خطوة بخطوة لبناء خدمة تعتمد على CacheService و QueueFactory ونمط النتيجة
tags:
  - tutorial
  - shared
  - error-handling
audience:
  - bot-developer
contentType: developer-docs
difficulty: beginner
lastVerified: 2026-06-17
---

## المتطلبات الأساسية

- بيئة تمبوت تعمل محلياً.
- تشغيل خادم Redis.
- معرفة بـ TypeScript ونمط `async/await`.

---

## بناء خدمة الإشعارات (`NotificationService`)

في هذا الدرس ستنشئ خدمة تخزن تفضيلات المستخدم مؤقتاً وتضع رسائل الإشعارات في طابور مهام مع تطبيق نمط `Result` في كافة الدوال.

### الخطوة 1: تعريف أكواد الأخطاء

```typescript
import { AppError, err, ok, type AsyncResult } from '@tempot/shared';

const ERRORS = {
  NOT_FOUND: 'notifications.preferences_not_found',
  QUEUE_FAILED: 'notifications.queue_send_failed',
} as const;
```

---

### الخطوة 2: تهيئة خدمة التخزين المؤقت (`CacheService`)

```typescript
import { CacheService } from '@tempot/shared';

const cache = new CacheService();

async function initCache(): AsyncResult<void> {
  return cache.init({ ttl: 300_000 }); // 5 دقائق
}
```

---

### الخطوة 3: إنشاء طابور المهام (`queueFactory`)

```typescript
import { queueFactory, ShutdownManager } from '@tempot/shared';

const shutdownManager = new ShutdownManager(logger);
const queueResult = queueFactory('notifications', { shutdownManager });
```

---

### الخطوة 4: ربط الخدمة وإرسال الإشعار

```typescript
async function sendNotification(userId: string, message: string): AsyncResult<void> {
  const prefs = await getPreferences(userId);
  if (prefs.isErr()) return prefs;

  if (queueResult.isErr()) {
    return err(new AppError(ERRORS.QUEUE_FAILED));
  }

  const queue = queueResult.value;
  await queue.add('send', { userId, message, locale: prefs.value.locale });
  return ok(undefined);
}
```

---

### الخطوة 5: الإغلاق الآمن للموارد

```typescript
process.on('SIGTERM', async () => {
  await shutdownManager.execute();
});
```
