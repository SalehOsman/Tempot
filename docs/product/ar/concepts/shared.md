---
title: حزمة الأساسيات المشتركة (Shared Package)
description: فهم الأدوات التأسيسية، شجرة معالجة الأخطاء، ونمط النتيجة والخدمات العابرة في تمبوت
tags:
  - concepts
  - shared
  - error-handling
audience:
  - package-developer
  - bot-developer
contentType: developer-docs
difficulty: intermediate
lastVerified: 2026-06-17
---

## ما هي حزمة الأساسيات المشتركة؟

تعتبر حزمة `@tempot/shared` حجر الأساس لجميع حزم وموديولات تمبوت. توفر الأدوات والأنواع والخدمات المشتركة: شجرة أخطاء موحدة (`AppError`)، نمط النتيجة (`Result Pattern`)، التخزين المؤقت (`CacheService`)، مصانع الطوابير (`QueueFactory`)، الإغلاق الآمن (`ShutdownManager`)، وحفظ سياق الجلسات (`SessionContext`).

---

## شجرة الأخطاء الموحدة (`AppError`)

تمتد جميع الأخطاء في تمبوت من فئة `AppError` وتحمل كوداً هرمياً يتبع نمط `{module}.{operation}_{outcome}`:

| الحقل | الوصف |
|---|---|
| `code` | كود الخطأ البرمجي (مثل `shared.cache_init_failed`) |
| `details` | بيانات تفصيلية مهيكلة حول سبب الفشل |
| `i18nKey` | مفتاح الترجمة المشتق تلقائياً `errors.{code}` |
| `referenceCode` | كود المرجع الموحد `ERR-YYYYMMDD-XXXX` لربط السجلات و Sentry |
| `loggedAt` | طابع زمني يمنع التكرار في التسجيل |

---

## نمط النتيجة الصارم (Result Pattern via neverthrow)

يمنع تمبوت رمي الاستثناءات (No exceptions thrown) في الواجهات العامة. تعيد جميع العمليات `Result<T, AppError>` (للعمليات التزامنية) أو `AsyncResult<T, AppError>` (للعمليات غير التزامنية):

```typescript
import { AppError, err, ok, type Result } from '@tempot/shared';

function validate(input: string): Result<string, AppError> {
  if (!input) {
    return err(new AppError('module.validation_failed'));
  }
  return ok(input.trim());
}
```

---

## خدمة التخزين المؤقت التراجعية (`CacheService`)

توفر `CacheService` واجهة تخزين موحدة مع تراجع تلقائي (Graceful Degradation):

1. **الطبقة الأساسية:** Redis (عبر محول Keyv) عندما يكون متوفراً.
2. **الطبقة التراجعية:** التخزين في الذاكرة (In-memory) فور فشل الاتصال بـ Redis دون تعطل البوت.
3. **التنبيه الفوري:** إطلاق حدث `system.alert.critical` عبر الـ Event Bus عند التراجع.

---

## إدارة الإغلاق الآمن وسياق الجلسات (Shutdown & Session Context)

- **`ShutdownManager`:** يتيح تسجيل مهام التنظيف (Cleanup Hooks) وإغلاق الاتصالات بأمان مع مهلة قصوى 30 ثانية.
- **`sessionContext`:** مبني على `AsyncLocalStorage` لتمرير هوية المستخدم، دوره، لغته، ومنطقته الزمنية عبر كافة دوال المعالجة دون الحاجة لتمريرها كمعاملات (Parameters).
