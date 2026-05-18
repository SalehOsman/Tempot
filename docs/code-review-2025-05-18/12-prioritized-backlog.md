# 12. قائمة المشاكل مرتبة حسب الأولوية — Technical Backlog

## تصنيف الجهد

- **XS** — أقل من ساعة
- **S** — من 1 إلى 4 ساعات
- **M** — يوم عمل
- **L** — من 2 إلى 5 أيام
- **XL** — أكثر من أسبوع

## Backlog

| الأولوية | المشكلة | النوع | الملف/المسار | التأثير | الحل | الجهد |
|---|---|---|---|---|---|---|
| P0 | WEBHOOK_SECRET env var mismatch | Bug | `apps/bot-server/src/startup/config.loader.ts:41` | Webhook mode لا يعمل | توحيد الاسم إلى `WEBHOOK_SECRET_TOKEN` | XS |
| P0 | sanitize-html vulnerability (Critical) | أمني | `apps/bot-server/package.json` | XSS bypass محتمل | `pnpm up sanitize-html` | XS |
| P1 | Template-management source مفقودة | تشغيلي | `modules/template-management/` | 4 tests فاشلة، CI fails | إنشاء deps.context.ts, version.service.ts, template-content.schema.ts | S |
| P1 | devalue vulnerability (High) | أمني | `apps/docs` (via astro) | Prototype pollution في docs | تحديث astro dependency | XS |
| P1 | SUPER_ADMIN_IDS hardcoded | أمني | `docker-compose.yml:36` | Information disclosure | `- SUPER_ADMIN_IDS=${SUPER_ADMIN_IDS:-}` | XS |
| P2 | Dockerfile find command fragile | تشغيلي | `apps/bot-server/Dockerfile:60-91` | Build قد يفشل مع pnpm updates | استبدال بمسار ثابت أو env var | M |
| P2 | No CD pipeline | تشغيلي | `.github/workflows/` | Deploy يدوي | إضافة Docker build + push workflow | M |
| P2 | Connection pool unlimited | أداء | `packages/database/src/prisma/prisma.client.ts:173` | Pool exhaustion under load | إضافة `max: 20` في Pool options | XS |
| P2 | Serial startup | أداء | `apps/bot-server/src/startup/deps.factory.ts:94-101` | +200-400ms startup time | `Promise.all([prisma.$connect(), buildEventBus()])` | S |
| P2 | Validation middleware placeholder | جودة | `bot/middleware/validation.middleware.ts` | لا يوجد input validation per-command | إضافة zod schemas | L |
| P3 | 15 peer dependencies | معمارية | `modules/user-management/package.json` | Coupling عالي | تقليل عبر port interface | L |
| P3 | Rate limiter in-memory only | قابلية توسع | `bot/middleware/rate-limiter.middleware.ts:48` | لا يعمل مع multi-instance | استبدال بـ RateLimiterRedis | S |
| P3 | esbuild vulnerability (Moderate) | أمني | via drizzle-kit (dev only) | Dev environment فقط | تحديث عند توفر fix | XS |
| P3 | No database migration automation | تشغيلي | — | Migrations يدوية | إضافة migration step في CI/CD | M |
| P3 | No monitoring/alerting | تشغيلي | — | لا يوجد alert عند failures | Sentry + health dashboard | L |
| P3 | Ability caching | أداء | `packages/auth-core/src/factory/ability.factory.ts` | Rebuild per-request | Add LRU cache | S |
| P3 | Deployment guide missing | توثيق | `docs/operations/` | No production deploy guide | كتابة deployment.md | S |
