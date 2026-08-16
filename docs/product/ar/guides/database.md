---
title: استخدام حزمة قاعدة البيانات (Database Guide)
description: دليل عملي للمستودعات، المعاملات، الحذف الناعم، والبحث بالمتجهات في تمبوت
tags:
  - guide
  - database
  - prisma
audience:
  - package-developer
  - bot-developer
contentType: developer-docs
difficulty: intermediate
lastVerified: 2026-07-22
---

## نظرة عامة

تفرض حزمة `@tempot/database` نمط المستودع (Repository Pattern) لكافة عمليات الوصول للبيانات. يشرح هذا الدليل كيفية توسيع `BaseRepository`، تنفيذ المعاملات المترابطة، التعامل مع الحذف الناعم، وإجراء عمليات البحث بالمتجهات.

---

## توسيع المستودع الأساسي (`BaseRepository`)

أنشئ مستودعاً مخصصاً لكل كيان في النظام:

```typescript
import { BaseRepository, type IAuditLogger } from '@tempot/database';
import type { Invoice } from '@prisma/client';

export class InvoiceRepository extends BaseRepository<Invoice> {
  protected moduleName = 'invoices';
  protected entityName = 'invoice';

  constructor(auditLogger: IAuditLogger) {
    super(auditLogger);
  }

  protected get model() {
    return this.db.invoice;
  }
}
```

يوفر المستودع دوال جاهزة: `findById`, `create`, `update`, و `delete`، بالإضافة لدالة `findMany` المحمية، وجميعها ترجع `Result<T, AppError>`.

---

## تنفيذ المعاملات المترابطة (`TransactionManager`)

لتنفيذ عمليات ذرية عبر أكثر من مستودع مع دعم التراجع التلقائي عند الخطأ:

```typescript
import { TransactionManager } from '@tempot/database';
import { ok } from 'neverthrow';

const result = await TransactionManager.run(async (tx) => {
  const invoiceRepo = invoiceRepository.withTransaction(tx);
  const paymentRepo = paymentRepository.withTransaction(tx);

  const invoice = await invoiceRepo.create({ amount: 500, customerId: 'c_1' });
  if (invoice.isErr()) return invoice;

  const payment = await paymentRepo.create({
    invoiceId: invoice.value.id,
    amount: 500,
  });
  if (payment.isErr()) return payment;

  return ok(invoice.value);
});
```

---

## آلية الحذف الناعم والفحص

- **عند الحذف:** يتم تحويل `delete()` إلى تحديث لتعيين `isDeleted = true` و `deletedAt = NOW()`.
- **عند القراءة:** يتم تلقائياً إضافة شرط `isDeleted = false` لمنع استرجاع السجلات المحذوفة.

---

## البحث الدلالي بالمتجهات (`DrizzleVectorRepository`)

لتخزين المتجهات والبحث الدلالي باستخدام `pgvector`:

```typescript
import { DrizzleVectorRepository } from '@tempot/database';

export class DocumentVectorRepo extends DrizzleVectorRepository {}

// تخزين المتجه
await vectorRepo.create({
  sourceId: 'doc_123',
  sourceType: 'document',
  content: 'نص المستند الأصلي',
  embedding: vectorArray, // 3072 بعد
});

// البحث بالتشابه
const searchResult = await vectorRepo.search(queryVector, 10);
```
