# 13. الحلول المقترحة

## مشكلة #1: WEBHOOK_SECRET env variable mismatch (P0)

### Quick Fix
```typescript
// apps/bot-server/src/startup/config.loader.ts:41
// قبل:
const webhookSecret = env['WEBHOOK_SECRET'];
// بعد:
const webhookSecret = env['WEBHOOK_SECRET_TOKEN'];
```

### Long-term Fix
- إضافة env validation schema (zod) يتحقق من وجود كل المتغيرات المطلوبة عند startup
- إضافة test يتأكد أن كل متغير في config.loader.ts موجود في .env.example

### أثر الحل
- Webhook mode يعمل بشكل صحيح
- لا يوجد breaking change (المتغير في .env.example لم يتغير)

### الملفات المتأثرة
- `apps/bot-server/src/startup/config.loader.ts`

### مخاطر التطبيق
- **لا مخاطر** — تغيير اسم متغير واحد

### كيف نختبر نجاح الحل
```typescript
// test
it('reads WEBHOOK_SECRET_TOKEN from env', () => {
  process.env.WEBHOOK_SECRET_TOKEN = 'test-secret';
  process.env.WEBHOOK_URL = 'https://example.com/webhook';
  process.env.BOT_MODE = 'webhook';
  const result = loadConfig();
  expect(result.isOk()).toBe(true);
  expect(result.value.webhookSecret).toBe('test-secret');
});
```

---

## مشكلة #2: sanitize-html vulnerability (P0)

### Quick Fix
```bash
pnpm up sanitize-html --latest
```

### Long-term Fix
- إضافة `pnpm audit --audit-level=high` كـ pre-commit hook أو CI gate (موجود بالفعل في CI)
- مراجعة Dependabot أو Renovate Bot لتحديثات تلقائية

### أثر الحل
- إغلاق ثغرة XSS bypass
- CI audit job ينجح

### الملفات المتأثرة
- `pnpm-lock.yaml`
- `apps/bot-server/package.json` (إذا كان direct dependency)
- `packages/cms-engine/package.json`
- `packages/i18n-core/package.json`

### مخاطر التطبيق
- تغيير API في sanitize-html (unlikely — patch update)
- تشغيل tests بعد التحديث للتأكد

### كيف نختبر نجاح الحل
```bash
pnpm audit --audit-level=high
# Expected: 0 critical, 0 high (after devalue fix too)
```

---

## مشكلة #3: Template-management source files مفقودة (P1)

### Quick Fix
إنشاء الملفات المفقودة بناءً على الـ tests التي تشير إليها:

1. `modules/template-management/deps.context.ts` — Module DI context (مثل user-management)
2. `modules/template-management/services/version.service.ts` — Template versioning logic
3. `modules/template-management/contracts/template-content.schema.ts` — Zod schemas

### Long-term Fix
- إضافة CI check يتحقق أن كل import في tests يشير إلى ملف موجود
- Module Doctor (`pnpm tempot doctor`) يفحص mandatory paths

### أثر الحل
- `pnpm test:unit` → 237/237 ✅
- CI pipeline ينجح بالكامل

### الملفات المتأثرة
- `modules/template-management/deps.context.ts` (جديد)
- `modules/template-management/services/version.service.ts` (جديد)
- `modules/template-management/contracts/template-content.schema.ts` (جديد)

### مخاطر التطبيق
- يجب التأكد أن الملفات الجديدة تطابق ما تتوقعه الـ tests
- مراجعة `dist/` للحصول على API surface المتوقع

### كيف نختبر نجاح الحل
```bash
pnpm test:unit
# Expected: 237 passed, 0 failed
```

---

## مشكلة #4: SUPER_ADMIN_IDS hardcoded (P1)

### Quick Fix
```yaml
# docker-compose.yml:36
# قبل:
- SUPER_ADMIN_IDS=7594239391
# بعد:
- SUPER_ADMIN_IDS=${SUPER_ADMIN_IDS:-}
```

### Long-term Fix
- نقل كل env values من docker-compose إلى .env فقط
- إضافة `.env.docker` template خاص بـ Docker dev

### أثر الحل
- لا يظهر Telegram ID في Git history (بعد squash/rebase)

### الملفات المتأثرة
- `docker-compose.yml`

### مخاطر التطبيق
- المطور يحتاج ملء `.env` قبل `docker compose up`
- إضافة تعليق يوضح ذلك

### كيف نختبر نجاح الحل
```bash
docker compose config | grep SUPER_ADMIN
# Expected: SUPER_ADMIN_IDS= (empty or from .env)
```

---

## مشكلة #5: Serial startup (P2)

### Quick Fix
```typescript
// deps.factory.ts — قبل:
await prisma.$connect();
const eventBusResult = await buildEventBus(log, shutdownManager, redisConfig());

// بعد:
const [, eventBusResult] = await Promise.all([
  prisma.$connect(),
  buildEventBus(log, shutdownManager, redisConfig()),
]);
```

### Long-term Fix
- رسم dependency graph للـ startup steps
- Parallelize كل الخطوات المستقلة
- Add startup timing metrics

### أثر الحل
- Startup time أسرع بـ 200-400ms
- Cold start أفضل

### الملفات المتأثرة
- `apps/bot-server/src/startup/deps.factory.ts`

### مخاطر التطبيق
- إذا فشل أحد العمليتين، يجب التأكد أن الآخر لا يبقى معلقاً
- `Promise.all` يفشل عند أول خطأ — مناسب هنا

### كيف نختبر نجاح الحل
- قياس startup time قبل وبعد
- Integration test يتأكد أن startup يكتمل بنجاح
