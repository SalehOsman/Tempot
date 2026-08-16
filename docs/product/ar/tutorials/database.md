---
title: إنشاء مستودع بيانات (Repository Tutorial)
description: درس تعليمي خطوة بخطوة لإنشاء مستودع قاعدة بيانات كامل لكيان جديد في تمبوت
tags:
  - tutorial
  - database
  - repository
audience:
  - bot-developer
contentType: developer-docs
difficulty: beginner
lastVerified: 2026-07-22
---

## المتطلبات الأساسية

- بيئة تطوير تمبوت تعمل بنجاح.
- تشغيل خادم PostgreSQL 16 المحلي.
- معرفة أساسية بـ Prisma و TypeScript.

---

## بناء مستودع المهام (`TaskRepository`)

في هذا الدرس ستنشئ كيان `Task` مع نموذج Prisma، مستودع مخصص، وعمليات معاملات مترابطة.

### الخطوة 1: تعريف نموذج Prisma

أضف نموذج `Task` إلى ملف `schema.prisma` متضمناً الحقول الثمانية لـ `BaseEntity`:

```prisma
model Task {
  id        String    @id @default(uuid())
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  createdBy String?
  updatedBy String?
  isDeleted Boolean   @default(false)
  deletedAt DateTime?
  deletedBy String?

  title     String
  status    String    @default("PENDING")
  assignee  String?
}
```

نفّذ الأوامر التالية لتطبيق التغييرات وتوليد العميل:
```bash
pnpm --filter @tempot/database db:generate
pnpm --filter @tempot/database db:migrate
```

---

### الخطوة 2: إنشاء فئة المستودع

أنشئ الفئة عبر وراثة `BaseRepository`:

```typescript
import { BaseRepository, type IAuditLogger } from '@tempot/database';
import type { Task } from '@prisma/client';

export class TaskRepository extends BaseRepository<Task> {
  protected moduleName = 'tasks';
  protected entityName = 'task';

  constructor(auditLogger: IAuditLogger) {
    super(auditLogger);
  }

  protected get model() {
    return this.db.task;
  }
}
```

---

### الخطوة 3: إضافة استعلامات مخصصة

```typescript
export class TaskRepository extends BaseRepository<Task> {
  // ... الأعضاء المجردة

  async findByAssignee(assignee: string) {
    return this.findMany({ assignee });
  }
}
```

---

### الخطوة 4: استخدام المستودع مع المعاملات

```typescript
import { TransactionManager } from '@tempot/database';
import { ok } from 'neverthrow';

const result = await TransactionManager.run(async (tx) => {
  const txRepo = taskRepo.withTransaction(tx);

  const task = await txRepo.create({ title: 'Deploy v2', assignee: 'user_1' });
  if (task.isErr()) return task;

  const updated = await txRepo.update(task.value.id, { status: 'IN_PROGRESS' });
  if (updated.isErr()) return updated;

  return ok(updated.value);
});
```
