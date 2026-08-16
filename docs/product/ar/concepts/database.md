---
title: حزمة قاعدة البيانات (Database Package)
description: فهم استراتيجية الـ ORM المزدوج، نمط المستودع، وآلية الحذف الناعم في تمبوت
tags:
  - concepts
  - database
  - prisma
audience:
  - package-developer
  - bot-developer
contentType: developer-docs
difficulty: intermediate
lastVerified: 2026-07-22
---

## ما هي حزمة قاعدة البيانات؟

تتولى حزمة `@tempot/database` إدارة كافة عمليات استدامة البيانات في تمبوت. توفر الحزمة تجريد نمط المستودع (Repository Pattern) فوق نظامي ORM، ومعالجة تلقائية للحذف الناعم (Soft-Delete)، وتعبئة حقول التدقيق الأمني، والبحث الدلالي بالمتجهات لميزات الذكاء الاصطناعي.

تتولى الحزمة أيضاً إدارة التشفير المحمي للبيانات الحساسة باستخدام مغلفات `AES-256-GCM` وتوكنات المطابقة الدقيقة `HMAC-SHA-256` مع دعم تدوير المفاتيح دون الحاجة لفك تشفير الجداول بالكامل.

---

## استراتيجية الـ ORM المزدوج (Dual-ORM Strategy)

يستخدم تمبوت نظامي ORM يتصلان بنفس قاعدة بيانات PostgreSQL 16:

| الـ ORM | المسؤولية | السبب |
|---|---|---|
| **Prisma 7+** | كافة البيانات العلائقية: عمليات CRUD، الهجرات، وتعريف المخططات | عميل مولد آمن برمجياً بالأنواع (Type-safe)، وتصميم يعتمد على Schema-first |
| **Drizzle ORM** | عمليات pgvector فقط: تخزين المتجهات والبحث الدلالي | يوفر دعم متكامل لأعمدة المتجهات `vector()` وفهارس HNSW لحساب تشابه الجيب تمام (Cosine Similarity) |

---

## نمط المستودع (Repository Pattern)

لا تقوم أي خدمة في تمبوت بالاتصال بـ Prisma مباشرة. تمر جميع العمليات عبر الفئة المجردة `BaseRepository` التي تفرض:

- فلترة تلقائية للحذف الناعم في كافة استعلامات القراءة.
- حقن حقول التدقيق (`createdBy`, `updatedBy`, `deletedBy`) تلقائياً عبر `AsyncLocalStorage`.
- تسجيل سجل التدقيق الأمني (Audit Trail) لكل عملية إضافة وتعديل وحذف.
- إرجاع النتائج بنمط `Result<T, AppError>` عبر `neverthrow` بدلاً من رمي الاستثناءات.
- دعم المعاملات المترابطة (Transactions) عبر `withTransaction(tx)`.

---

## آلية الحذف الناعم (Soft-Delete Mechanism)

تستخدم النماذج القابلة للحذف تقنية `$extends()` الخاصة بـ Prisma على مستويين:

### اعتراض الكتابة (Write Interception)
عند استدعاء `model.delete()`، يعترض الامتداد العملية ويحولها إلى `update` يضبط `isDeleted = true` و `deletedAt = new Date()`. الحذف الفيزيائي الفعلي لا يحدث أبداً في العمليات التشغيلية.

### فلترة القراءة (Read Filtering)
تفرض استعلامات `findMany`, `findFirst`, و `count` شرط `isDeleted: false` دائماً، مما يبقي السجلات المحذوفة غير مرئية لتطبيقات البوت.

---

## حقول التدقيق القياسية (Audit Fields)

يمتد كل كائن من `BaseEntity` الذي يعرف 8 حقول قياسية:

| الحقل | التعيين التلقائي | الحدث |
|---|---|---|
| `id` | المعرف الافتراضي في Prisma | INSERT |
| `createdAt` | `@default(now())` | INSERT |
| `updatedAt` | `@updatedAt` | UPDATE |
| `createdBy` | `BaseRepository` عبر `sessionContext` | INSERT |
| `updatedBy` | `BaseRepository` عبر `sessionContext` | UPDATE |
| `isDeleted` | امتداد الحذف الناعم | DELETE |
| `deletedAt` | امتداد الحذف الناعم | DELETE |
| `deletedBy` | `BaseRepository` عبر `sessionContext` | DELETE |

---

## إدارة المعاملات المترابطة (TransactionManager)

يوفر `TransactionManager` تنفيذ العمليات المتعددة على المستودعات بشكل ذري (Atomic)، مع التراجع التلقائي (Rollback) عند حدوث أي خطأ:

```typescript
import { TransactionManager } from '@tempot/database';

const result = await TransactionManager.run(async (tx) => {
  const userRepo = userRepository.withTransaction(tx);
  const user = await userRepo.create({ name: 'Alice' });
  if (user.isErr()) return user;
  return ok(user.value);
});
```

---

## مستودع المتجهات والتدقيق (Vector & Audit Repositories)

- **`DrizzleVectorRepository`:** يدعم البحث بالتشابه الدلالي لمتجهات تصل إلى 4000 بعد (الأبعاد الافتراضية 3072) باستخدام فهارس HNSW السريعة.
- **`AuditLogRepository`:** مستودع غير قابل للتعديل أو الحذف، ويتجاوز تسجيل العمليات ذاتياً لتفادي الحلقات اللانهائية.
