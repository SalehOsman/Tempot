# 06 - تحليل الاعتماديات وإدارة الحزم

## نمط Monorepo

- pnpm workspaces مع `apps/*`, `packages/*`, `modules/*`.
- lockfile واحد كبير: `pnpm-lock.yaml` (~470KB).
- 32 workspace projects تبنى ضمن CI (`pnpm build`).

## أهم الاعتماديات في الجذر (`package.json:38-65`)

| الاعتماد | الإصدار | ملاحظة |
|---------|---------|---------|
| `typescript` | `5.9.3` | مثبت بدقة وفق الدستور |
| `vitest` | `4.1.0` | مثبت بدقة |
| `@vitest/coverage-v8` | `^4.0.0` | متناسق |
| `eslint` | `^10.0.0` | حديث |
| `typescript-eslint` | `^8.0.0` | حديث |
| `eslint-plugin-boundaries` | `^6.0.2` | يطبق ADR-035 |
| `eslint-plugin-check-file` | `^3.3.1` | لقواعد التسمية |
| `prisma` | `^7.8.0` | يطابق Constitution |
| `drizzle-kit` | `^0.31.10` | لـ pgvector |
| `husky` | `^9.0.0` | git hooks |
| `lint-staged` | `^16.4.0` | تشغيل lint قبل commit |
| `tsx` | `^4.19.2` | تشغيل TS مباشرة |
| `@changesets/cli` | `^2.30.0` | إدارة الإصدارات |
| `@commitlint/cli` | `^20.5.0` | conventional commits |

## أهم اعتماديات `apps/bot-server` (`package.json`)

`grammy ^1.41.1`, `hono ^4.12.15`, `@hono/node-server ^1.19.14`,
`@grammyjs/conversations ^2.1.1`, `@casl/ability ^6.7.3`,
`ioredis 5.10.1`, `neverthrow 8.2.0`, `rate-limiter-flexible ^5.0.4`,
`sanitize-html ^2.17.4`. كلها متناسقة مع الدستور.

## overrides أمنية صريحة

`pnpm-workspace.yaml:15-27` يحتوي تعليقات تشير إلى CVE/GHSA لكل override:

| الحزمة | السبب |
|--------|--------|
| `devalue >=5.8.1` | CVE-2025-47935 |
| `esbuild >=0.25.0` | dev-server CORS |
| `@hono/node-server >=1.19.13` | GHSA-92pp-h63x-v22m middleware bypass |
| `protobufjs >=7.5.8` | GHSA-jggg-4jg4-v7c6 DoS |
| `tmp >=0.2.6` | GHSA-ph9p-34f9-6g65 path traversal |

هذا نموذج جيد جدًا للنضج الأمني في إدارة الحزم.

## scripts عامة (`package.json:7-35`)

تنظيم شبه ممتاز للعمل اليومي:

| نوع | الأمر |
|-----|-------|
| تطوير | `dev`, `dev:bot`, `dev:tunnel` |
| webhook | `webhook:set/info/delete` |
| بناء | `build`, `build:bot-runtime` |
| اختبار | `test`, `test:unit`, `test:integration`, `test:coverage` |
| جودة | `lint`, `format`, `boundary:audit`, `module:checklist`, `cms:check`, `spec:validate` |
| Docker | `docker:dev`, `docker:down`, `docker:logs`, `docker:reset` |
| إصدارات | `changeset`, `changeset:status`, `changeset:version` |
| أداة الحوكمة | `tempot` (يشغّل `scripts/tempot/index.ts`) |

## ملاحظات على الاعتماديات

| البند | الدليل | الخطورة |
|-------|--------|----------|
| لا حقل `packageManager` في `package.json` | الجذر | Medium (Spec #056 conformance) |
| README يذكر pnpm 10+ بينما CI و ROADMAP يذكران pnpm 11+ | `README.md:32` vs `ci.yml:15` و `ROADMAP.md:13` | Low |
| 6 moderate + 1 low CVE تبقى بعد override (تدقيق 2026-06-07) | `pnpm audit` | Low (لأن البوابة `--audit-level=high`) |
| `docs:freshness` script غير موجود في الجذر بينما يستخدم في توثيق | تدقيق 2026-06-07 + `docs/ROADMAP.md:293` | Medium |
| AGENTS.md يذكر `pnpm spec:validate` في bullet list دستوري — يجب أن يبقى متزامنًا مع scripts | متطابق حاليًا | OK |
| `@types/node` في الجذر `22.19.17` بينما في bot-server `^22.19.17` — متوافق | Low |
| لا Dependabot/Renovate config | غياب | Medium |

## scripts المنهجية (`scripts/`)

| السكربت | الدور |
|---------|-------|
| `scripts/ci/import-boundary-audit.cli.ts` | فرض الحدود |
| `scripts/ci/module-package-checklist-audit.ts` | تطبيق checklist |
| `scripts/spec-validate/index.ts` | تحقق من اتساق specs |
| `scripts/tempot/index.ts` | CLI تطوير (`pnpm tempot init/doctor/module ...`) |
| `scripts/insert-user.ts` | أداة DB محلية |
| `scripts/setup-dev.sh` | سكربت تجهيز محلي (Linux/Mac فقط) |

ملاحظة: `setup-dev.sh` لا يوفر بديل PowerShell على Windows رغم أن
المطور الحالي يعمل على Windows (`AGENTS.md` يذكر PowerShell).

## التقييم

- **سلامة قائمة الاعتماديات**: 88%
- **استجابة الـ CVEs**: 92%
- **تنسيق الإصدارات الحرجة (ts/vitest/neverthrow)**: 100%
- **سكربتات npm/pnpm**: 90%
- **Reproducibility (lockfile, frozen-lockfile)**: 90%
- **ضبط Toolchain (`packageManager`, `engines`)**: 70%
- **Update automation (Dependabot/Renovate)**: 0%
- **الإجمالي**: 82%

## التوصيات المنهجية

1. تثبيت `packageManager: "pnpm@11.x.y"` في `package.json` ضمن
   Spec #056 (Toolchain conformance task).
2. تفعيل Dependabot weekly لـ `npm` و `github-actions` ضمن Spec #056.
3. توحيد README مع ROADMAP حول إصدار pnpm — تحديث وثائقي بسيط.
4. إضافة سكربت `setup-dev.ps1` ضمن DX (Spec #056) لتقليل احتكاك
   المطور على Windows.
5. إصلاح أو إزالة `pnpm docs:freshness` بشكل قاطع — ضمن Spec #056.
