---
title: إضافة التسجيل والتدقيق للخدمة (Logger Tutorial)
description: درس تعليمي خطوة بخطوة لإضافة التسجيل التقني وسجلات التدقيق إلى خدمة في تمبوت
tags:
  - tutorial
  - logger
  - observability
audience:
  - bot-developer
contentType: developer-docs
difficulty: beginner
lastVerified: 2026-06-16
---

## المتطلبات الأساسية

- بيئة تمبوت تعمل محلياً.
- تشغيل خادم PostgreSQL (لتخزين سجلات التدقيق).
- فهم نمط النتيجة (`Result`) في حزمة `@tempot/shared`.

---

## إضافة التسجيل لخدمة الطلبات (`OrderService`)

في هذا الدرس ستضيف تسجيلاً تقنياً مهيكلاً وسجلات تدقيق أمني لتتبع دورة حياة الطلبات.

### الخطوة 1: استيراد المسجل التقني

```typescript
import { logger } from '@tempot/logger';

logger.info({ msg: 'تم تهيئة خدمة الطلبات بنجاح' });
```

---

### الخطوة 2: التسجيل بالمستويات المناسبة

```typescript
import { AppError, type AsyncResult } from '@tempot/shared';
import { ok, err } from 'neverthrow';

async function processOrder(orderId: string): AsyncResult<string> {
  logger.info({ msg: 'بدء معالجة الطلب', orderId });

  const validated = validateOrder(orderId);
  if (validated.isErr()) {
    logger.warn({ msg: 'فشل التحقق من صحة الطلب', orderId });
    return validated;
  }

  logger.debug({ msg: 'تم التحقق بنجاح، جاري الدفع', orderId });
  return ok(orderId);
}
```

---

### الخطوة 3: تسجيل الأخطاء مع حجب البيانات الحساسة

```typescript
function validateOrder(orderId: string) {
  if (!orderId) {
    const error = new AppError('orders.validation_failed', {
      reason: 'missing_id',
    });
    logger.error({ err: error, msg: 'خطأ في التحقق من الطلب' });
    return err(error);
  }
  return ok(orderId);
}
```

---

### الخطوة 4: تسجيل تغييرات الحالة في سجل التدقيق (`AuditLogger`)

```typescript
import { AuditLogger, type AuditLogEntry } from '@tempot/logger';
import { AuditLogRepository } from '@tempot/database';

const auditLogRepo = new AuditLogRepository({ log: async () => {} });
const auditLogger = new AuditLogger(auditLogRepo);

async function updateOrderStatus(orderId: string, oldStatus: string, newStatus: string): AsyncResult<void> {
  const entry: AuditLogEntry = {
    action: 'orders.order.update',
    module: 'orders',
    targetId: orderId,
    before: { status: oldStatus },
    after: { status: newStatus },
  };

  return auditLogger.log(entry);
}
```

---

### الخطوة 5: ربط سياق الجلسة تلقائياً (`sessionContext`)

```typescript
import { sessionContext } from '@tempot/shared';

async function handleRequest(userId: string) {
  sessionContext.run({ userId, userRole: 'USER' }, async () => {
    // جميع سجلات التدقيق ورسائل logger هنا ستتضمن userId تلقائياً
    await processOrder('ord_123');
    await updateOrderStatus('ord_123', 'PENDING', 'CONFIRMED');
  });
}
```
