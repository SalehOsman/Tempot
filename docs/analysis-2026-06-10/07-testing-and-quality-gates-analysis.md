# 07 - تحليل الاختبارات وبوابات الجودة

## البنية الاختبارية

- **محرك الاختبار**: Vitest 4.1.0 (مثبت بدقة).
- **مشاريع Vitest**: `--project=unit` و `--project=integration` على
  مستوى الجذر (`vitest.config.ts`, `vitest.config.base.ts`).
- **حسب تدقيق 2026-06-07**:
  - 313 ملف اختبار، 1989 حالة اختبار في الجذر.
  - 241 ملف unit، 1942 اختبار → نجاح.
  - 14 ملف integration، 47 اختبار → نجاح (مع خدمات postgres+redis).
  - 7 ملفات + 119 اختبار في `apps/docs` → نجاح.
  - 185 نجاح + **2 فشل** في `apps/bot-server` → غير مرئي في CI الجذر.

## التغطية

- `pnpm test:coverage` يعطي:
  - Statements: 84.07%
  - Branches: 75.64%
  - Functions: 71.04%
  - Lines: 85.11%

تغطية إجمالية جيدة، لكن لا توجد سياسة tier لكل حزمة (مثلًا 95% للحزم
الحرجة، 70% للوحدات). هذه الفجوة موثقة في Spec #056 (Coverage tiers).

## بوابات الجودة الموجودة

| البوابة | تطبيق آلي |
|---------|-----------|
| `pnpm lint` | CI: lint job |
| `pnpm build` | CI: typecheck job + كل وظائف الاختبار |
| `pnpm test:unit` | CI: test-unit job |
| `pnpm test:integration` | CI: test-integration job (مع خدمات) |
| `pnpm spec:validate` | CI: methodology job |
| `pnpm cms:check` | CI: methodology job |
| `pnpm boundary:audit` | CI: methodology job |
| `pnpm module:checklist` | CI: methodology job |
| `pnpm tempot init && pnpm tempot doctor --quick` | CI: methodology job |
| `git diff --check` | CI: methodology job |
| `pnpm audit --audit-level=high` | CI: audit job |
| `pnpm changeset status` | CI: changeset-check (PR only) |
| Vale prose lint | CI: docs-lint (مسار محدود) |

هذه قائمة بوابات قوية فوق المتوسط بكثير، لكنها تفتقد:

- اختبارات `apps/bot-server` و `apps/docs` ضمن `pnpm test:unit`.
- بوابة `docs:freshness` (الـ script مكسور).
- بوابة Coverage threshold ملزمة بـ CI.
- بوابة E2E (مثلًا اختبار حلقة /start كاملة عبر mock Telegram).
- بوابة Container scan (Trivy/Grype).

## أدوات lint/format/typecheck

| الأداة | الإعداد |
|--------|---------|
| ESLint | `eslint.config.js` flat config، 8 حقول قواعد |
| Prettier | `.prettierrc` (~106 بايت) |
| TypeScript | `tsconfig.json` strict + NodeNext + noEmit |
| commitlint | `commitlint.config.js` + Conventional Commits |
| Husky + lint-staged | hooks محلية للـ pre-commit |

## نقاط الضعف

| البند | الدليل | الخطورة |
|-------|--------|----------|
| اختبارات `apps/*` خارج CI الجذر | تدقيق 2026-06-07 + `vitest.config.ts` | High |
| فشلين فعليين في `bot-server` غير ملاحظين | تدقيق 2026-06-07 | High |
| لا threshold ملزم في `vitest --coverage` | `vitest.config.ts` (~1KB) | Medium |
| `docs:freshness` معطل | تدقيق 2026-06-07 | Medium |
| لا اختبار E2E موثق | غياب من `tests/` | Medium |
| لا اختبار حمل/أداء | غياب | Low |
| لا اختبار تركيبات `TEMPOT_*` flag (matrix) | غياب | Low |

## التقييم

- **بنية الاختبارات**: 85%
- **التغطية الفعلية**: 80%
- **بوابات الجودة الجذرية**: 85%
- **تكامل التطبيقات في CI**: 50%
- **سياسة coverage**: 50%
- **جودة E2E**: 40%
- **الإجمالي**: 78%

## خطة اختبار عملية (تنفذ ضمن Spec #056)

### المرحلة 1 — إصلاح الرؤية

1. إدراج `apps/bot-server` و `apps/docs` ضمن `vitest projects`.
2. إصلاح الاختبارين الفاشلين في `bot-server`.
3. تأكد من ظهور النتائج في `pnpm test:unit` على CI.

معيار قبول: `pnpm test:unit` يفشل (RED) قبل الإصلاح، ينجح (GREEN) بعده.

### المرحلة 2 — Tiered Coverage

1. تعريف tiers في الدستور (مثلًا: foundation 95%، infrastructure 90%،
   cross-cutting 85%، domain 80%، modules 75%).
2. إضافة `coverage.thresholds` لكل package في `vitest.config.ts`.
3. توثيق السياسة في `docs/developer/`.

### المرحلة 3 — اختبارات flag-matrix

سكربت يشغّل `test:integration` على عينة تركيبات `TEMPOT_*=true|false`
الرئيسية للتأكد من Pluggable correctness.

### المرحلة 4 — E2E خفيف

اختبار سيناريو واحد كامل (`/start` → menu → user-management view) عبر
mock telegram + WebSocket إلى Hono.

### المرحلة 5 — Container scan

إضافة Trivy/Grype إلى `docker.yml` كخطوة قبل push (ضمن Spec #057).

كل المراحل تمر عبر SpecKit Specs #056 و #057 الحاليتين، لا فروع موازية.
