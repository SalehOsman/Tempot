---
title: استخدام حزمة المسجل (Logger Guide)
description: دليل عملي للتسجيل المهيكل، سجلات التدقيق، تسلسل الأخطاء، وحجب البيانات الحساسة في تمبوت
tags:
  - guide
  - logger
  - observability
audience:
  - package-developer
  - bot-developer
contentType: developer-docs
difficulty: intermediate
lastVerified: 2026-06-16
---

## نظرة عامة

توفر حزمة `@tempot/logger` نظامين للتسجيل: المسجل التقني المبني على Pino لتشخيص العمليات، ومسجل التدقيق `AuditLogger` لتتبع تغييرات الحالات التشغيلية والامتثال. يوضح هذا الدليل كيفية استخدام كلا النظامين وضبط المستويات ومعالجة الأخطاء.

---

## استخدام المسجل التقني (Technical Logger)

استورد كائن `logger` الجاهز واستدعِ دوال المستويات:

```typescript
import { logger } from '@tempot/logger';

logger.info({ msg: 'تمت معالجة الطلب', orderId: 'ord_123' });
logger.warn({ msg: 'لم يتم العثور على البيانات في الذاكرة المؤقتة', key: 'user:456' });
logger.error({ err: appError, msg: 'فشلت عملية الدفع' });
```

تطبع كافة المخرجات كـ JSON مهيكل، مع حقن معرف المستخدم `userId` تلقائياً من `sessionContext`.

---

## تسجيل الأخطاء البرمجية (`AppError`)

مرر كائنات `AppError` عبر مفتاح `err` لتفعيل التسلسل الذكي للأخطاء:

```typescript
import { AppError } from '@tempot/shared';
import { logger } from '@tempot/logger';

const error = new AppError('invoices.creation_failed', {
  customerId: 'c_123',
  reason: 'duplicate',
});

logger.error({ err: error, msg: 'فشل إنشاء الفاتورة' });
```

- يمنع التسلسل تكرار طباعة نفس الخطأ أكثر من مرة (`No Double Logging`).

---

## استخدام مسجل التدقيق الأمني (`AuditLogger`)

لحفظ وتتبع التغييرات التشغيلية الحساسة في قاعدة البيانات:

```typescript
import { AuditLogger, type AuditLogEntry } from '@tempot/logger';

const entry: AuditLogEntry = {
  action: 'invoices.invoice.update',
  module: 'invoices',
  targetId: 'inv_123',
  before: { status: 'DRAFT', amount: 400 },
  after: { status: 'SENT', amount: 500 },
};

await auditLogger.log(entry);
```

- يتم استخراج `userId` و `userRole` تلقائياً من سياق الجلسة.
- يتم توليد كود المرجع `ERR-YYYYMMDD-XXXX` تلقائياً في العمليات غير الناجحة.
