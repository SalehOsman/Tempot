# 12. قائمة المشاكل مرتبة حسب الأولوية — Technical Backlog

> 🔄 **تحديث 2026-05-20:** بعض البنود أُغلقت. راجع [18-status-update.md](./18-status-update.md) للتفاصيل.

## تصنيف الجهد

- **XS** — أقل من ساعة
- **S** — من 1 إلى 4 ساعات
- **M** — يوم عمل
- **L** — من 2 إلى 5 أيام
- **XL** — أكثر من أسبوع

## Backlog

| الأولوية | المشكلة | النوع | الملف/المسار | التأثير | الحل | الجهد |
|---|---|---|---|---|---|---|
| P0 | ~~WEBHOOK_SECRET env var mismatch~~ ✅ **مُصلحة** | Bug | `apps/bot-server/src/startup/config.loader.ts:41` | Webhook mode لا يعمل | وُحِّد الاسم إلى `WEBHOOK_SECRET_TOKEN` (commit `94c0889`) | XS |
| P0 | ~~sanitize-html vulnerability (Critical)~~ ✅ **مُصلحة** | أمني | `apps/bot-server/package.json` | XSS bypass محتمل | `pnpm up sanitize-html` (commit `dd912c7`) | XS |
| P1 | ~~Template-management source مفقودة~~ ✅ **مُستعادة** | تشغيلي | `modules/template-management/` | 4 tests فاشلة، CI fails | استُعيدت من Git HEAD | S |
| P1 | ~~devalue vulnerability (High)~~ ✅ **مُصلحة** | أمني | `apps/docs` (via astro) | Prototype pollution في docs | override في `pnpm-workspace.yaml` (commit `dd912c7`) | XS |
| P1 | ~~SUPER_ADMIN_IDS hardcoded~~ ✅ **مُصلحة** | أمني | `docker-compose.yml:36` | Information disclosure | نُقِل إلى `${SUPER_ADMIN_IDS:-}` (commit `94c0889`) | XS |
| P2 | Dockerfile find command fragile | تشغيلي | `apps/bot-server/Dockerfile:60-91` | Build قد يفشل مع pnpm updates | استبدال بمسار ثابت أو env var | M |
| P2 | No CD pipeline | تشغيلي | `.github/workflows/` | Deploy يدوي | إضافة Docker build + push workflow | M |
| P2 | ~~Connection pool unlimited~~ ✅ **مُصلحة** | أداء | `packages/database/src/prisma/prisma.client.ts:173` | Pool exhaustion under load | أُضيف `max: 20` + `idleTimeoutMillis: 30000` + `DATABASE_POOL_MAX` env override (commit `94c0889`) | XS |
| P2 | Serial startup | أداء | `apps/bot-server/src/startup/deps.factory.ts:94-101` | +200-400ms startup time | `Promise.all([prisma.$connect(), buildEventBus()])` | S |
| P2 | Validation middleware placeholder | جودة | `bot/middleware/validation.middleware.ts` | لا يوجد input validation per-command | إضافة zod schemas | L |
| P3 | 15 peer dependencies | معمارية | `modules/user-management/package.json` | Coupling عالي | تقليل عبر port interface | L |
| P3 | Rate limiter in-memory only | قابلية توسع | `bot/middleware/rate-limiter.middleware.ts:48` | لا يعمل مع multi-instance | استبدال بـ RateLimiterRedis | S |
| P3 | esbuild vulnerability (Moderate) | أمني | via drizzle-kit (dev only) | Dev environment فقط | تحديث عند توفر fix | XS |
| P3 | No database migration automation | تشغيلي | — | Migrations يدوية | إضافة migration step في CI/CD | M |
| P3 | No monitoring/alerting | تشغيلي | — | لا يوجد alert عند failures | Sentry + health dashboard | L |
| P3 | Ability caching | أداء | `packages/auth-core/src/factory/ability.factory.ts` | Rebuild per-request | Add LRU cache | S |
| P3 | Deployment guide missing | توثيق | `docs/operations/` | No production deploy guide | كتابة deployment.md | S |
