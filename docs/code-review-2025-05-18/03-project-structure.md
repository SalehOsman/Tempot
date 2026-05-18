# 3. تحليل هيكل المشروع

## التنظيم العام

```
📁 apps/
  ├── bot-server/          ← التطبيق الرئيسي (Hono + grammY)
  │   ├── src/
  │   │   ├── bot/         ← Bot factory + middleware chain (8 middlewares)
  │   │   ├── server/      ← Hono HTTP server + routes (health, webhook)
  │   │   └── startup/     ← Orchestrator, deps factory, config, shutdown
  │   ├── tests/
  │   ├── locales/         ← Bot-level i18n messages
  │   └── Dockerfile
  └── docs/                ← Astro Starlight documentation site

📁 packages/               ← 21 حزمة بنية تحتية مشتركة
  ├── shared/              ← Foundation: AppError, Result, ShutdownManager, CacheService
  ├── database/            ← Infrastructure: Prisma + Drizzle + Extensions
  ├── event-bus/           ← Infrastructure: Local + Redis distributed bus
  ├── logger/              ← Infrastructure: Pino structured logging
  ├── sentry/              ← Infrastructure: Error reporting
  ├── auth-core/           ← Cross-cutting: CASL abilities + guards
  ├── i18n-core/           ← Cross-cutting: Arabic-first i18n + CMS validators
  ├── session-manager/     ← Cross-cutting: Redis sessions + migration
  ├── settings/            ← Cross-cutting: Static + Dynamic settings
  ├── module-registry/     ← Cross-cutting: Module discovery + validation
  ├── ai-core/             ← Domain: AI SDK integration, RAG, embeddings
  ├── ux-helpers/          ← Domain: Keyboard builders, pagination, formatters
  ├── input-engine/        ← Domain: Conversational input flows
  ├── regional-engine/     ← Domain: Locale-aware formatting
  ├── national-id-parser/  ← Domain: Egyptian ID parsing
  ├── notifier/            ← Domain: Queue-based notifications
  ├── storage-engine/      ← Domain: File storage abstraction
  ├── cms-engine/          ← Domain: Dynamic translation overrides
  ├── search-engine/       ← Domain: Relational + semantic search
  ├── document-engine/     ← Domain: PDF/XLSX generation
  └── import-engine/       ← Domain: CSV/spreadsheet import

📁 modules/                ← وحدات الأعمال
  ├── user-management/     ← مكتمل: إدارة المستخدمين
  ├── template-management/ ← مكتمل جزئياً: إدارة القوالب
  └── bot-management/      ← مكتمل: إدارة البوتات

📁 specs/                  ← SpecKit artifacts (spec.md, plan.md, tasks.md)
📁 docs/                   ← Product & architecture documentation
📁 scripts/                ← CI scripts, CLI tools, dev utilities
📁 .github/workflows/      ← CI pipeline (ci.yml, docs-lint.yml)
```

## تقييم الهيكل

| المعيار | الحالة | الملاحظات |
|---|---|---|
| فصل الطبقات | ✅ ممتاز | apps / packages / modules واضح ومفروض بـ ESLint boundaries |
| Module isolation | ✅ ممتاز | كل module مستقل مع package.json, tests, types, locales |
| Dependency direction | ✅ ممتاز | 4-tier (Foundation → Infrastructure → Cross-cutting → Domain) |
| Business logic separation | ✅ جيد | Services → Repositories → Database، لا يوجد خلط |
| Config isolation | ✅ جيد | .env.example منظم بأقسام، config.loader مع validation |
| Scalability structure | ✅ جيد | Module discovery ديناميكي — إضافة module جديد = folder + manifest |

## هل الهيكل منطقي؟

**نعم** — الهيكل يتبع نمط Modular Monolith الاحترافي مع:
- Workspace-level dependency management (pnpm)
- Tier-based import boundaries (ESLint plugin)
- Module contracts via TypeScript interfaces
- Dynamic module discovery at runtime

## ملفات تحتاج انتباه

| الملف/المجلد | الملاحظة | الأولوية |
|---|---|---|
| `modules/template-management/` | ملفات source مفقودة (deps.context.ts, version.service.ts) — Tests تشير إليها | High |
| `packages/database/prisma/schema.prisma` | يحتوي models من modules (Template, ManagedBot) | Medium — مصمم هكذا لأن Prisma يتطلب schema واحد |
| `docker-compose.yml` | SUPER_ADMIN_IDS hardcoded | Medium |
| `apps/bot-server/Dockerfile:60-91` | find commands لتحديد مسارات | Medium — يعمل لكن fragile |
