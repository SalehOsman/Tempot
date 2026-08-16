---
title: استخدام حزمة الأساسيات المشتركة (Shared Guide)
description: دليل عملي لمعالجة الأخطاء، التخزين المؤقت، الطوابير، الإغلاق الآمن، ومفاتيح التبديل في تمبوت
tags:
  - guide
  - shared
  - error-handling
audience:
  - package-developer
  - bot-developer
contentType: developer-docs
difficulty: intermediate
lastVerified: 2026-06-17
---

## نظرة عامة

توفر حزمة `@tempot/shared` الأدوات الأساسية المشتركة لكافة أجزاء تمبوت. يغطي هذا الدليل إنشاء الأخطاء، استخدام نمط النتيجة (`Result`)، ضبط التخزين المؤقت، إنشاء الطوابير، تسجيل دوال الإغلاق الآمن، وإعداد مفاتيح التبديل البرمجية.

---

## إنشاء كائنات الأخطاء (`AppError`)

أنشئ الأخطاء متبوعة بكود هرمي وبيانات مهيكلة:

```typescript
import { AppError } from '@tempot/shared';

const error = new AppError('invoices.payment_failed', {
  invoiceId: 'inv_123',
  reason: 'insufficient_funds',
});
```

---

## استخدام نمط النتيجة (`Result Pattern`)

تعيد كافة الدوال العامة كائنات النتيجة بدلاً من رمي الاستثناءات:

```typescript
import { AppError, err, ok, type Result } from '@tempot/shared';

function parseAmount(input: string): Result<number, AppError> {
  const amount = Number(input);
  if (Number.isNaN(amount)) {
    return err(new AppError('billing.parse_failed', { input }));
  }
  return ok(amount);
}

// معالجة النتيجة
parseAmount(raw).match(
  (value) => logger.info({ msg: 'تم التحليل بنجاح', value }),
  (error) => logger.error({ err: error }),
);
```

---

## إعداد خدمة التخزين المؤقت (`CacheService`)

```typescript
import { CacheService } from '@tempot/shared';

const cache = new CacheService(eventBus, logger);
await cache.init({ ttl: 60_000 });

// العمليات
await cache.set('user:123', userData, 300_000);
const result = await cache.get<UserData>('user:123');
await cache.del('user:123');
```

---

## إنشاء طابور المهام (`queueFactory`)

```typescript
import { queueFactory, type QueueFactoryOptions } from '@tempot/shared';

const options: QueueFactoryOptions = {
  shutdownManager,
  queueOptions: { defaultJobOptions: { removeOnComplete: 100 } },
};

const result = queueFactory('email-notifications', options);
if (result.isOk()) {
  const queue = result.value;
  await queue.add('welcome-email', { userId: 'user_123' });
}
```

---

## مفاتيح التبديل البرمجية (Toggle Guards)

للتحكم في تفعيل أو تعطيل الحزم عبر المتغيرات البيئية:

```typescript
import { createToggleGuard } from '@tempot/shared';

const searchToggle = createToggleGuard('TEMPOT_SEARCH', 'search-engine');

function search(query: string): Result<SearchResult[], AppError> {
  const disabled = searchToggle.check();
  if (disabled) return disabled; // يرجع خطأ أن الحزمة معطلة

  return ok(results);
}
```
