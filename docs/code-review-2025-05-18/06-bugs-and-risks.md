# 6. تحليل الأخطاء والمخاطر البرمجية

## Bugs فعلية مؤكدة

### Bug #1: WEBHOOK_SECRET env variable name mismatch (CRITICAL)

**الوصف:** الكود يقرأ `WEBHOOK_SECRET` لكن `.env.example` يُعرّف `WEBHOOK_SECRET_TOKEN`.

**الدليل:**
```typescript
// apps/bot-server/src/startup/config.loader.ts:41
const webhookSecret = env['WEBHOOK_SECRET'];
```

```ini
# .env.example:37
WEBHOOK_SECRET_TOKEN=
```

**السيناريو:** عند نشر التطبيق بـ webhook mode واستخدام `.env` مبني على `.env.example`، المتغير `WEBHOOK_SECRET` سيكون `undefined` لأن المستخدم ملأ `WEBHOOK_SECRET_TOKEN`.

**التأثير:**
- `validateWebhookFields()` يُرجع `err(MISSING_WEBHOOK_SECRET)`
- التطبيق يرفض startup في webhook mode
- Bot offline في Production

**الحل:** توحيد الاسم — إما تعديل config.loader.ts ليقرأ `WEBHOOK_SECRET_TOKEN` أو تعديل .env.example.

---

### Bug #2: Template-management source files مفقودة (HIGH)

**الوصف:** Tests تشير إلى ملفات source غير موجودة.

**الدليل:**
```
Error: Cannot find module './deps.context.js'
  imported from F:/Tempot/modules/template-management/index.ts

Error: Cannot find module '../../services/version.service.js'
  imported from .../tests/unit/version.service.test.ts

Error: Cannot find module '../../contracts/template-content.schema.js'
  imported from .../tests/unit/template-content-schema.test.ts
```

**السيناريو:** عند تشغيل `pnpm test:unit`، 4 اختبارات تفشل.

**التأثير:**
- CI pipeline يفشل (exit code 1)
- 4 ملفات test لا تعمل

**الحل:** إنشاء الملفات المفقودة: `deps.context.ts`, `services/version.service.ts`, `contracts/template-content.schema.ts`

---

## مخاطر مستقبلية

### Risk #1: BigInt serialization في حالات خاصة

**الوصف:** `telegramId` معرّف كـ `BigInt` في Prisma schema.

**الدليل:**
```prisma
// packages/database/prisma/schema.prisma
model UserProfile {
  telegramId BigInt @unique
}
```

**السيناريو:** إذا تم `JSON.stringify()` مباشرة على Prisma result بدون تحويل — JavaScript لا يدعم BigInt في JSON.

**التأثير الفعلي:** **منخفض** — الـ service layer يستخدم `string` للـ telegramId، وPino logger يدعم BigInt serialization.

**الحل الوقائي:** إضافة `BigInt.prototype.toJSON` global override أو استخدام `@map` في Prisma.

---

### Risk #2: Serial startup sequence

**الوصف:** كل خطوات الـ startup تُنفذ بالتسلسل.

**الدليل:**
```typescript
// deps.factory.ts:94-121
await prisma.$connect();           // Wait
const eventBusResult = await buildEventBus(...);  // Wait
const cacheResult = await buildCacheService(...); // Wait
const sessionProvider = buildSessionProvider(...); // Sync
```

**السيناريو:** في بيئة بطيئة (cold start)، كل خطوة تضيف latency.

**التأثير:** Startup time أطول مما يلزم (estimated +1-2s).

**الحل:** `Promise.all([prisma.$connect(), buildEventBus()])` للخطوات المستقلة.

---

### Risk #3: Rate Limiter in-memory only

**الوصف:** Rate limiter يستخدم `RateLimiterMemory` (in-process).

**الدليل:**
```typescript
// bot/middleware/rate-limiter.middleware.ts:48-52
const limiters: Record<UpdateScope, RateLimiterMemory> = {
  command: new RateLimiterMemory(SCOPE_CONFIGS.command),
  upload: new RateLimiterMemory(SCOPE_CONFIGS.upload),
  message: new RateLimiterMemory(SCOPE_CONFIGS.message),
};
```

**السيناريو:** إذا تم تشغيل أكثر من instance واحد (horizontal scaling)، كل instance له limiter مستقل.

**التأثير:** المستخدم يحصل على ضعف الـ rate limit.

**الحل المستقبلي:** استبدال بـ `RateLimiterRedis` عند الانتقال لـ multi-instance.

---

### Risk #4: Prisma connection pool exhaustion

**الوصف:** `prisma.$connect()` يستخدم pool size الافتراضي.

**الدليل:**
```typescript
// prisma.client.ts:173
const pool = new Pool({ connectionString });
```

لا يوجد `max` parameter أو `connection_limit`.

**السيناريو:** Under high load، pool connections تنفد → timeout errors.

**التأثير:** Database queries تبدأ بالفشل.

**الحل:** إضافة `max: 20` (أو حسب الـ workload) في Pool options.

---

## Dependency Version Risks

| الحزمة | الخطر | الملاحظة |
|---|---|---|
| `sanitize-html ≤2.17.3` | Critical vulnerability | تحديث فوري مطلوب |
| `devalue 5.6.3-5.8.0` | High vulnerability | Via astro — docs app فقط |
| `esbuild ≤0.24.2` | Moderate | Dev dependency via drizzle-kit |
| `@hono/node-server <1.19.13` | Moderate | **محلول بالفعل** عبر pnpm override |
