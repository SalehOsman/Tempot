# 9. تحليل الأداء — Performance

## Bottlenecks المحتملة

| المنطقة | الملف | المشكلة | الخطورة | الحل |
|---|---|---|---|---|
| Serial startup | `deps.factory.ts:94-121` | كل خطوة تنتظر السابقة | Medium | Parallelize: `$connect()` ‖ `buildEventBus()` |
| Ability rebuild per-request | `ability.factory.ts:14` | `definitions.flatMap(def => def(user).rules)` | Medium | Add LRU cache keyed by userId+role |
| Prisma pool defaults | `prisma.client.ts:173` | `new Pool({ connectionString })` بدون max | Medium | إضافة `max: 20` |
| Rate limiter in-memory | `rate-limiter.middleware.ts:48-52` | RateLimiterMemory — لا يشارك state بين instances | Low | مقبول لـ single-instance |
| Health probes sequential | `health.route.ts:54-56` | `Promise.allSettled` — هذا **جيد** بالفعل | None | ✅ Already parallel |

## تحليل Startup Time

ترتيب الـ startup الحالي:
```
1. prisma.$connect()            ~200-500ms
2. buildEventBus()              ~100-300ms (Redis connection)
3. buildCacheService()          ~50-100ms
4. buildSessionProvider()       <10ms (sync)
5. buildSettingsService()       <10ms (sync)
6. initI18n()                   ~50-100ms
7. loadModuleLocales()          ~50-100ms
8. buildModuleRegistry()        <10ms (sync)
9. initSentry()                 ~50-100ms
---
Total estimated: ~500-1200ms
```

**تحسين ممكن:** Steps 1-2 مستقلة → `Promise.all` يوفر ~200-400ms.

## Database Performance

### Indexes (from schema.prisma)

```prisma
model UserProfile {
  @@index([role])
  @@index([language])
  @@index([isDeleted])
  @@index([lastActiveAt])
  @@index([createdAt])
  // + telegramId @unique (implicit index)
}
```

**تقييم:** Indexes مناسبة للـ queries المتوقعة. لا يوجد over-indexing واضح.

### Soft Delete Query Extension

```typescript
// prisma.client.ts:126-143 — Query extensions
async findMany({ args, query }) {
  args.where = { isDeleted: false, ...(args.where ?? {}) };
  return query(args);
}
```

**تقييم:** ✅ يضيف `isDeleted: false` تلقائياً لكل query — يستفيد من index.

## Caching Strategy

```typescript
// packages/shared/src/cache/cache.service.ts (inferred from exports)
// + User service uses in-memory cache
// + Session service uses Redis
// + Settings service uses CacheService
```

**تقييم:** Multi-level caching موجود:
- **L1:** In-memory (UserService cache)
- **L2:** Redis (SessionManager, CacheService)
- **L3:** PostgreSQL

## توصيات تحسين الأداء

| الأولوية | التحسين | التأثير المتوقع | الجهد |
|---|---|---|---|
| 1 | Parallelize startup (prisma ‖ eventBus) | -200-400ms startup | S |
| 2 | Add connection pool limit | Prevent pool exhaustion | XS |
| 3 | Cache CASL abilities (LRU by userId+role) | Reduce CPU per-request | S |
| 4 | Move to RateLimiterRedis (when scaling) | Accurate multi-instance limiting | M |
| 5 | Add Prisma query logging (dev mode) | Detect N+1 queries | XS |
