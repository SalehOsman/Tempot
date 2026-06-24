# 06 - تحليل الاعتماديات

## 1. مدير الحزم

| البند             | القيمة                                                        |
| ----------------- | ------------------------------------------------------------- |
| Package manager   | `pnpm@10.33.3` (pinned in `packageManager`)                  |
| Node engine       | `>=22.12.0`                                                  |
| Workspaces        | `apps/*`, `packages/*`, `modules/*` (`pnpm-workspace.yaml`)  |
| Lock file         | `pnpm-lock.yaml` موجود (~447KB)                              |
| Frozen lockfile   | مُفرَض في CI و Dockerfile                                     |

> **ملاحظة:** `CONTRIBUTING.md` كان يذكر "pnpm 11 or newer". الـ ROADMAP صحّحها صراحة إلى `10.33.3` لأن pnpm 11 يتطلب Node 22.13+ والحد الأدنى الدستوري `22.12.0`. تحتاج `CONTRIBUTING.md` تحديثًا بسيطًا لتعكس ذلك.

## 2. الإصدارات الحرجة المثبَّتة بدقة

| الحزمة          | الإصدار   | المرجع الدستوري                              |
| --------------- | --------- | -------------------------------------------- |
| `typescript`    | `5.9.3`   | Rule LXXVI + AGENTS.md Locked Stack          |
| `vitest`        | `4.1.0`   | Rule LXXIII + Rule LXXVI                     |
| `neverthrow`    | `8.2.0`   | Rule XXI + Rule LXXVI                        |

كل من الثلاثة مطلوب أن يكون **بدون caret** — تحقق سريع: `@types/node` أيضًا مثبَّت بـ `22.19.17` بدقة في root devDependencies.

## 3. pnpm overrides (security-driven)

```json
"overrides": {
  "@grpc/grpc-js": ">=1.14.4",
  "@hono/node-server": ">=1.19.13",
  "devalue": ">=5.8.1",
  "esbuild": ">=0.28.1",
  "markdown-it": "14.2.0",
  "protobufjs": ">=8.4.1",
  "qs": "6.15.2",
  "tmp": ">=0.2.6",
  "undici": "7.28.0",
  "vite": ">=7.3.5"
}
```

كل override موثقة في `pnpm-workspace.yaml` بتعليقات تشرح CVE/GHSA المرتبط. هذا نمط مثالي.

## 4. auditConfig

```json
"auditConfig": {
  "ignoreCves": ["CVE-2026-53550"],
  "ignoreGhsas": ["GHSA-h67p-54hq-rp68"]
}
```

> توصية: لكل تجاهل، يجب أن يوجد ملاحظة قصيرة في `docs/security/audit-suppressions.md` تشرح السبب وتاريخ المراجعة القادمة (يفضّل تاريخ انتهاء صلاحية).

## 5. السكربتات (`package.json`)

### 5.1 التطوير

| الأمر                    | الغرض                                                                     |
| ------------------------ | ------------------------------------------------------------------------- |
| `pnpm dev`               | تشغيل `bot-server` للتطوير.                                                |
| `pnpm dev:bot`           | بناء runtime ثم تشغيل watch على كل الـ packages المرتبطة + bot-server.    |
| `pnpm dev:tunnel`        | تشغيل tunnel للـ webhook المحلي.                                          |
| `pnpm webhook:set/info/delete` | إدارة الـ webhook.                                                  |

### 5.2 البناء

| الأمر                       | الغرض                                                  |
| --------------------------- | ------------------------------------------------------ |
| `pnpm build`                | `pnpm --recursive build`.                              |
| `pnpm build:bot-runtime`    | فلتر زمن تشغيل البوت فقط (يستثني docs).                |
| `pnpm runtime:manifest`     | يولّد `runtime-manifest.json`.                         |

### 5.3 الاختبار

| الأمر                  | الغرض                                                                    |
| ---------------------- | ------------------------------------------------------------------------ |
| `pnpm test`            | `test:inventory` ثم `vitest run --reporter=verbose`.                     |
| `pnpm test:unit`       | vitest projects: unit + application.                                     |
| `pnpm test:integration`| vitest project: integration.                                              |
| `pnpm test:e2e`        | vitest project: e2e.                                                     |
| `pnpm test:coverage`   | coverage + `coverage-policy.ts` يفحص coverage-summary.json.              |
| `pnpm test:inventory`  | `test-project-inventory.ts` (يكشف tests غير مدرجة).                       |

### 5.4 الجودة والمنهجية

| الأمر                          | الغرض                                                                    |
| ------------------------------ | ------------------------------------------------------------------------ |
| `pnpm lint`                    | ESLint.                                                                   |
| `pnpm format`                  | Prettier.                                                                 |
| `pnpm boundary:audit`          | فحص حدود الاستيراد بين الـ packages.                                      |
| `pnpm authorization:check`     | فحص تغطية CASL في الـ handlers/services.                                  |
| `pnpm module:checklist`        | فحص اكتمال package-creation-checklist لكل وحدة.                          |
| `pnpm source:conformance`      | فحص تواجد أنماط الكود المطلوبة (file names, no banned, ...).             |
| `pnpm toolchain:audit`         | فحص ثبات إصدارات critical (TS 5.9.3, Vitest 4.1.0, neverthrow 8.2.0).      |
| `pnpm spec:validate`           | فحص تطابق specs مع code (reconciliation gate).                            |
| `pnpm cms:check`               | فحص اكتمال الترجمات (Rule XLIII).                                         |
| `pnpm docs:check`              | freshness + validate + claims.                                            |

### 5.5 الإصدارات

| الأمر                       | الغرض                                                  |
| --------------------------- | ------------------------------------------------------ |
| `pnpm changeset`            | إنشاء changeset.                                       |
| `pnpm changeset:status`     | فحص وجود changesets معلَّقة.                            |
| `pnpm changeset:version`    | تطبيق changesets على versions + CHANGELOG.            |

### 5.6 Docker

| الأمر                  | الغرض                                              |
| ---------------------- | -------------------------------------------------- |
| `pnpm docker:dev`      | `docker compose up -d`.                            |
| `pnpm docker:down`     | `docker compose down`.                             |
| `pnpm docker:logs`     | `docker compose logs -f`.                          |
| `pnpm docker:reset`    | `docker compose down -v && docker compose up -d`.  |

### 5.7 CLI الخاص بالمشروع

| الأمر                      | الغرض                                                     |
| -------------------------- | --------------------------------------------------------- |
| `pnpm tempot`              | يستدعي `scripts/tempot/index.ts` (init/doctor/module/...). |

## 6. devDependencies الرئيسية على الجذر

| الحزمة                                     | الإصدار          | الدور                                              |
| ------------------------------------------ | ---------------- | -------------------------------------------------- |
| `@changesets/cli`                          | `^2.30.0`        | إصدارات.                                           |
| `@commitlint/cli`                          | `^20.5.0`        | فحص رسائل commit.                                  |
| `@commitlint/config-conventional`          | `^20.5.0`        | إعداد Conventional Commits.                        |
| `@eslint/js`                               | `^10.0.0`        | ESLint core.                                       |
| `eslint`                                   | `^10.0.0`        | linter.                                            |
| `eslint-plugin-boundaries`                 | `^6.0.2`         | تطبيق ADR-035.                                     |
| `eslint-plugin-check-file`                 | `^3.3.1`         | تطبيق Rule III.                                    |
| `eslint-import-resolver-typescript`        | `^4.4.4`         | حل الاستيراد لـ TypeScript paths.                  |
| `eslint-config-prettier`                   | `^10.0.0`        | تعطيل قواعد متعارضة مع Prettier.                   |
| `husky`                                    | `^9.0.0`         | git hooks.                                         |
| `lint-staged`                              | `^16.4.0`        | فحص staged files فقط.                              |
| `prettier`                                 | `^3.0.0`         | formatter.                                         |
| `prisma`                                   | `^7.8.0`         | client generator.                                  |
| `tsx`                                      | `^4.19.2`        | تشغيل scripts TS.                                  |
| `typescript-eslint`                        | `^8.0.0`         | قواعد TS لـ ESLint.                                 |
| `@vitest/coverage-v8`                      | `4.1.0`          | coverage v8.                                       |

## 7. الاعتماديات حسب الحزمة (نموذج)

`packages/database/package.json`:

- **deps:** `@prisma/adapter-pg`, `@prisma/client`, `@tempot/shared` (workspace), `drizzle-orm`, `neverthrow` (`8.2.0` ثابت), `pg`, `prisma`.
- **devDeps:** `@testcontainers/postgresql`, `glob`, `drizzle-kit`, `tsx`, `typescript@5.9.3`, `vitest@4.1.0`.

`modules/user-management/package.json` يستخدم `peerDependencies` لجميع `@tempot/*` و`grammy` و`@casl/ability` و`neverthrow` — نمط نظيف لمنع تضارب نسخ.

## 8. حالة الاعتماديات

| البند                                                                                                | الحالة     |
| ---------------------------------------------------------------------------------------------------- | ---------- |
| Phantom dependencies                                                                                 | لم يُرصَد (Rule LXXVII يُفحص محليًا بـ grep). |
| إصدارات قديمة معروفة                                                                                 | لا — الإصدارات مرفّعة (typescript-eslint 8، eslint 10، husky 9، vitest 4، prisma 7، drizzle 0.45). |
| تعارضات إصدارات                                                                                      | لا — `pnpm-lock.yaml` متّسق + frozen-lockfile.  |
| إعلانات أمنية مفتوحة                                                                                  | معالجة عبر overrides + auditConfig.  |
| استخدام `peerDependencies` للحزم المشتركة                                                            | نمط جيد ومطبق.  |
| نسخ متعددة من `vitest`                                                                                | لا (مثبتة `4.1.0` بدقة على الجذر، وReplicated في كل package).  |

## 9. ملاحظات على السكربتات

| البند                                                                                                            | الخطورة |
| ---------------------------------------------------------------------------------------------------------------- | ------- |
| `pnpm test` لا يشمل `lint` أو `spec:validate` (متعمد: السرعة).                                                   | Low     |
| لا يوجد سكربت موحَّد `pnpm verify` يجمع: `lint + build + test:unit + spec:validate + boundary:audit`.            | Low     |
| `setup-dev.sh` فقط (لا `setup-dev.ps1`) — Windows-first مطورو Tempot قد يحتاجون ما يكافئه.                       | Low     |
| `pnpm test:coverage` يقرأ `coverage/coverage-summary.json` لكن صيغة Vitest الافتراضية ربما تحتاج تأكيد reporter. | Medium  |

## 10. توصيات إدارة الحزم

> كل توصية تمر عبر منهجية SpecKit، يفضّل دمجها في spec `documentation/dx` لاحقة.

1. **توحيد إصدار pnpm في `CONTRIBUTING.md`** ليطابق `packageManager` في `package.json` (`10.33.3`) بدل "pnpm 11 or newer".
2. **إضافة سكربت `pnpm verify`** كاختصار قبل الـ push (lint + typecheck + unit + boundary + spec:validate).
3. **إضافة Dependabot/Renovate config** لمراقبة التحديثات الأمنية والمساعدة على الترقيع المنتظم.
4. **توثيق سبب كل audit suppression** في `docs/security/audit-suppressions.md` مع تاريخ مراجعة قادم.
5. **إضافة `setup-dev.ps1`** للمطورين على Windows لإكمال `setup-dev.sh`.
6. **توثيق متى يجب استخدام `peerDependencies` مقابل `dependencies`** للوحدات/الحزم في `docs/developer/`.

## 11. خلاصة

إدارة الاعتماديات في Tempot **محكمة ومتقنة**: pnpm pinned، lockfile مفروض، إصدارات critical exact، overrides أمنية موثَّقة، audit في CI. القائمة المتبقية كلها تحسينات تجربة-مطوّر صغيرة الحجم، لا قضايا أمنية أو تشغيلية.
