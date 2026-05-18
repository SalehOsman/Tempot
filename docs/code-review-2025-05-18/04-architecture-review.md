# 4. تحليل المعمارية — Architecture Review

## نمط المعمارية المستخدم

- **Modular Monolith** مع استعداد لـ SaaS (multi-bot future)
- **Ports & Adapters** (Repository Pattern + Service Pattern)
- **Event-Driven Communication** بين Modules عبر Redis pub/sub
- **Dependency Injection** يدوي عبر factory functions
- **Result Pattern** (neverthrow) بدلاً من exceptions
- **Feature Flags** (TEMPOT_* toggles) لتمكين/تعطيل الميزات ديناميكياً

## نقاط القوة المعمارية

### 1. Prisma Client Extensions — Soft Delete مركزي

```typescript
// packages/database/src/prisma/prisma.client.ts:92-118
const modelExtensions = {
  $allModels: {
    async delete<T, A>(this: T, args: Prisma.Exact<A, Prisma.Args<T, 'delete'>>) {
      const context = PrismaRuntime.getExtensionContext(this);
      const typedArgs = args as unknown as DeleteArgs;
      const data: SoftDeleteData = typedArgs.data ?? {};
      return (context as Record<string, (...args: unknown[]) => unknown>).update({
        ...typedArgs,
        data: { ...data, isDeleted: true, deletedAt: new Date() },
      });
    },
  },
};
```
**القوة:** كل `delete()` في المشروع يتحول تلقائياً إلى soft delete بدون كود إضافي في كل repository.

### 2. Startup Orchestrator — Fatal Steps Pattern

```typescript
// apps/bot-server/src/startup/orchestrator.ts:118-172
async function runFatalSteps(config, deps): AsyncResult<FatalStepsOutput> {
  // Each step returns Result — failure stops the chain
  const dbResult = await deps.connectDatabase();
  if (dbResult.isErr()) return err(dbResult.error);
  
  const bootstrapResult = await deps.bootstrapSuperAdmins(config.superAdminIds);
  if (bootstrapResult.isErr()) return err(bootstrapResult.error);
  // ...
}
```
**القوة:** Startup محدد ومُراقب — أي خطوة تفشل توقف التطبيق بشكل نظيف مع logging.

### 3. Module Discovery & Validation

```typescript
// packages/module-registry/src/ — 7 ملفات متخصصة
// module-discovery.service.ts — اكتشاف تلقائي من filesystem
// module-validator.service.ts — تحقق من contracts, specs, mandatory paths
// module-config.schema.ts — schema validation لكل module.manifest.ts
```
**القوة:** إضافة module جديد = إنشاء folder + manifest.ts. النظام يكتشفه ويتحقق منه تلقائياً.

### 4. Middleware Chain — Fixed Order

```typescript
// apps/bot-server/src/bot/bot.factory.ts:37-54
bot.use(createSanitizerMiddleware());      // 1. HTML sanitization
bot.use(createRateLimiterMiddleware());    // 2. Per-scope rate limiting
bot.use(createMaintenanceMiddleware());    // 3. Maintenance mode check
bot.use(createAuthMiddleware());           // 4. User authentication
bot.use(createScopedUsersMiddleware());    // 5. Super admin scoping
bot.use(createValidationMiddleware());     // 6. Input validation slot
bot.use(createInteractionObserverMiddleware()); // 7. Observability
bot.use(conversations());                 // 8. Conversation support
bot.use(createAuditMiddleware());         // 9. Audit logging
bot.catch(createErrorBoundary());         // Error boundary
```
**القوة:** ترتيب ثابت وموثق — كل middleware مسؤول عن شيء واحد.

### 5. Health Probes — Subsystem Classification

```typescript
// apps/bot-server/src/startup/health.probes.ts
// Critical: database, redis → unhealthy
// Non-critical: ai_provider, disk, queue → degraded
// Each probe has timeout (4s) and error isolation
```

## نقاط الضعف المعمارية

| المشكلة | الملف | التأثير | التوصية |
|---|---|---|---|
| Serial startup | `deps.factory.ts:94-121` | Prisma → EventBus → Cache → Session بالتسلسل | Parallelize independent steps (EventBus || Cache) |
| Settings fallback silently | `deps.factory.ts:72-80` | StaticSettings failure يعطي empty values | Log warning + use failsafe defaults with documentation |
| No outbox pattern | `orchestrator.ts:88-105` | Startup event fire-and-forget | مقبول لـ non-critical events — توثيق القرار |
| Dual ORM | `packages/database/` | Prisma + Drizzle معاً | **مُبرر** — Drizzle لـ pgvector فقط (Prisma لا يدعمه) |
| Validation middleware placeholder | `validation.middleware.ts` | Pass-through بدون logic | إضافة zod schema validation مستقبلاً |

## Coupling Analysis

| العلاقة | المستوى | الملاحظة |
|---|---|---|
| packages ↔ packages | ✅ Low | Tier-based imports enforced بـ ESLint |
| modules ↔ packages | ⚠️ Medium | 15 peer deps في user-management |
| modules ↔ modules | ✅ None | لا يوجد import مباشر — EventBus فقط |
| bot-server ↔ packages | ✅ Expected | Entry point يجمع كل التبعيات |

## Abstraction Quality

| الطبقة | التقييم | الملاحظة |
|---|---|---|
| Repository Pattern | ✅ ممتاز | BaseRepository مع Result + AuditLog + Soft Delete |
| Service Pattern | ✅ جيد | Services تعتمد على Repository ports |
| Event Bus | ✅ جيد | Orchestrator pattern مع Local + Redis bus |
| Auth | ✅ جيد | AbilityFactory + Guard + Toggle |
| Config | ✅ جيد | StaticSettingsLoader + DynamicSettingsService |

## توصيات معمارية عملية

1. **Parallelize startup** — `prisma.$connect()` و `buildEventBus()` يمكنهما العمل بالتوازي (توفير ~1-2s)
2. **Add Ports interface لـ modules** — بدلاً من 15 peer deps، module يعتمد على port interface واحد
3. **Document Drizzle usage scope** — توثيق واضح أن Drizzle مخصص لـ pgvector فقط
4. **Add zod validation** — ملء الـ validation middleware placeholder بـ per-command schemas
