# 07 - تحليل الاختبارات وبوابات الجودة

## 1. الإطار المرجعي

- **Rule XXXIV:** TDD إلزامي (RED → GREEN → REFACTOR).
- **Rule XXXV:** Test Pyramid 70/20/10 (unit/integration/e2e).
- **Rule XXXVI:** Coverage thresholds: Services 80%، Handlers 70%، Repositories 60%، Conversations 50%.
- **Rule LXXIII:** كل حزمة لها `vitest.config.ts` و`vitest: "4.1.0"` ثابت.
- **Rule XXXVII:** `describe("FeatureName")` + `it("should ... when ...")` بالإنجليزية، استقلال الـ tests.

## 2. مدى توفر الاختبارات (إحصاء فعلي)

### 2.1 الحزم (`packages/`)

| الحزمة                       | ملفات `.test.ts`      |
| ---------------------------- | --------------------- |
| `ai-core`                    | 30                    |
| `auth-core`                  | 6                     |
| `cms-engine`                 | 6                     |
| `database`                   | 17                    |
| `document-engine`            | 4                     |
| `event-bus`                  | 6                     |
| `i18n-core`                  | 8                     |
| `import-engine`              | 5                     |
| `input-engine`               | 61                    |
| `interaction-observability`  | **1** ⚠️              |
| `logger`                     | 5                     |
| `module-registry`            | 6                     |
| `national-id-parser`         | 1                     |
| `notifier`                   | 6                     |
| `regional-engine`            | 7                     |
| `search-engine`              | 5                     |
| `sentry`                     | 4                     |
| `session-manager`            | 7                     |
| `settings`                   | 8                     |
| `shared`                     | 8                     |
| `storage-engine`             | 12                    |
| `ux-helpers`                 | 21                    |
| **المجموع**                  | **231**               |

### 2.2 الـ Modules (`modules/`)

| الوحدة                  | ملفات `.test.ts` |
| ----------------------- | ----------------- |
| `audit-viewer`           | 6                 |
| `bot-management`         | 18                |
| `content-management`     | 4                 |
| `help-center`            | 4                 |
| `membership-management`  | 3                 |
| `notification-center`    | 4                 |
| `settings-management`    | 4                 |
| `template-management`    | 15                |
| `user-management`        | 22                |
| **المجموع**             | **80**            |

### 2.3 التطبيقات (`apps/`)

| التطبيق     | ملفات `.test.ts`  |
| ----------- | ----------------- |
| `bot-server`| 38                |
| `docs`      | 8                 |
| **المجموع** | **46**            |

### 2.4 الإجمالي

| البند                                                                          | القيمة      |
| ------------------------------------------------------------------------------ | ----------- |
| إجمالي ملفات `.test.ts` في الـ workspace                                       | **357**     |
| إجمالي ملفات `.ts` المصدرية (src)                                              | **588**     |
| نسبة test-files / source-files                                                  | **0.61**    |

## 3. بنية Vitest

`vitest.config.ts` ينظم أربع projects:

| Project       | Include patterns                                                                                                              | تطبيق Rule |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------- |
| `unit`        | `apps/*/tests/unit/**`, `packages/*/tests/unit/**`, `modules/*/tests/unit/**`, `scripts/*/tests/unit/**`                       | Pyramid 70%|
| `integration` | `apps/*/tests/integration/**`, `packages/*/tests/integration/**`, `modules/*/tests/integration/**` — `fileParallelism: false` | Pyramid 20%|
| `application` | `apps/*/tests/**`, `packages/*/tests/**`, `modules/*/tests/**`, `scripts/*/tests/**` (يستثني unit/integration/e2e)             | تكميل       |
| `e2e`         | `apps/*/tests/e2e/**` — `fileParallelism: false`                                                                              | Pyramid 10%|

`vitest.config.base.ts` يوفّر `baseExclude` مشترك. `testTimeout: 120_000` و `hookTimeout: 120_000` يدعمان Testcontainers.

## 4. Coverage

| البند                                                  | القيمة                                                                                                |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Coverage provider                                      | `v8`.                                                                                                |
| Reporters                                              | `text`, `json-summary`, `lcov`, `html`.                                                              |
| Include                                                | `apps/*/src/**/*.ts`, `packages/*/src/**/*.ts`, `modules/*/**/*.ts`.                                |
| Exclude                                                | `*.d.ts`, `*.config.ts`, `index.ts`, `generated/**`, `modules/*/tests/**`, `packages/database/src/generated/**`. |
| Coverage policy enforcement                            | `scripts/ci/coverage-policy.ts` يقرأ `coverage/coverage-summary.json` ويفشل وفق Rule XXXVI.        |
| Blocking في CI                                         | ✅ منذ 2026-06-17 (ROADMAP).                                                                          |
| `coverage-summary.json` محليًا                          | ❌ غير موجود وقت التحليل — لم يُولَّد بعد محليًا في هذا التشغيل.                                       |

## 5. Quality Gates في CI (`.github/workflows/ci.yml`)

| Gate                | الأمر(الأوامر)                                                                       |
| ------------------- | ------------------------------------------------------------------------------------ |
| Methodology         | `spec:validate`, `cms:check`, `boundary:audit`, `authorization:check`, `module:checklist`, `source:conformance`, `toolchain:audit`, `docs:check`, `tempot init`, `tempot doctor --quick`, whitespace check |
| Lint                | `pnpm lint`                                                                          |
| Typecheck           | `pnpm build` (matrix Node 22.12, 24)                                                |
| Unit                | `test:inventory` + `test:unit`                                                       |
| Integration + E2E   | `pnpm test:integration && pnpm test:e2e` مع Postgres + Redis services                |
| Coverage            | `pnpm test:coverage` (blocking)                                                     |
| Audit               | `pnpm audit --audit-level=high`                                                     |
| Changeset           | على PR فقط                                                                           |

> **بوابة `test:inventory`** (`scripts/ci/test-project-inventory.ts`) أداة بارعة: تكشف tests غير مدرجة في أي vitest project. هذا يحلّ تحديًا شائعًا في monorepos حيث تكتب tests لكن لا تشتغل لأنها خارج include.

## 6. lint/format/typecheck

| الأداة               | الحضور | الفرض                                                                  |
| -------------------- | ------ | ----------------------------------------------------------------------- |
| ESLint               | ✅      | `pnpm lint` + lint-staged + Husky pre-commit.                          |
| Prettier             | ✅      | `pnpm format` + lint-staged.                                            |
| TypeScript           | ✅      | `pnpm build` (strict + NodeNext).                                       |
| commitlint           | ✅      | Husky commit-msg.                                                       |
| Spec validation      | ✅      | `pnpm spec:validate`.                                                   |
| Boundary audit       | ✅      | `scripts/ci/import-boundary-audit.cli.ts`.                              |
| Authorization audit  | ✅      | `scripts/ci/authorization-coverage-audit.ts`.                            |
| Module checklist     | ✅      | `scripts/ci/module-package-checklist-audit.ts`.                          |
| Source conformance   | ✅      | `scripts/ci/source-conformance-audit.ts`.                                |
| Toolchain audit      | ✅      | `scripts/ci/toolchain-audit.ts` (يضمن TS/Vitest/neverthrow exact pins).   |
| Docs freshness/claims| ✅      | `pnpm docs:check`.                                                       |

## 7. الفجوات المرصودة

| رقم | الفجوة                                                                                                          | الخطورة | الدليل                                                                |
| --- | ---------------------------------------------------------------------------------------------------------------- | ------- | --------------------------------------------------------------------- |
| T1  | `interaction-observability` يحتوي ملف اختبار واحد فقط رغم كونها Cross-cutting Tier 3.                              | Medium  | inventory.                                                            |
| T2  | لا توجد عتبات coverage مفروضة على مستوى كل حزمة فقط على المستوى الكلي (Rule XXXVI يذكر مكونات صنفية).               | Medium  | `coverage-policy.ts` يجب التحقق من تطبيق Component-level thresholds.   |
| T3  | لا يوجد upload لـ coverage إلى Codecov/Coveralls لمراجعة تاريخية بصرية.                                          | Low     | `.github/workflows/ci.yml` coverage job.                              |
| T4  | لا يوجد `mutation testing` (Stryker مثلاً) — اختياري لكنه يقيس جودة الـ tests، لا فقط وجودها.                       | Low     | لا يوجد config.                                                       |
| T5  | لا يوجد سكربت محلي `pnpm verify` يدمج: lint + typecheck + unit + boundary + spec:validate.                       | Low     | `package.json`.                                                       |
| T6  | اختبارات بصرية أو snapshot لـ Telegram inline keyboards ليست مرئية — قد تكون مدمجة ضمن ux-helpers لكن غير موثقة.   | Low     | `packages/ux-helpers/tests/`.                                         |
| T7  | لا يوجد contract tests بين الـ modules والـ event-bus (مع أن الـ event types معرّفة في `@tempot/event-bus`).         | Medium  | ADR-036 يوصف typed publish contracts لكن contract tests غير ظاهرة.      |

## 8. خطة اختبار عملية مقترحة

> تنفَّذ عبر منهجية SpecKit + Superpowers ضمن spec واحد بعنوان مقترح `059-test-coverage-uplift`.

### 8.1 مرحلة عاجلة (P0)

| المهمة                                                                                  | الناتج المتوقع                                              |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| توليد `coverage-summary.json` افتراضيًا بعد `pnpm test:coverage` محليًا.                  | تأكيد أن الـ policy تعمل محليًا قبل الـ push.                |
| توثيق عتبات Rule XXXVI per-component داخل `coverage-policy.ts` وإثبات تطبيقها.            | bot-server, packages services ≥80%, handlers ≥70%, repos ≥60%, conversations ≥50%. |
| إضافة `pnpm verify` سكربت موحَّد على الجذر.                                              | تجربة مطور أسلس قبل الـ push.                                |

### 8.2 مرحلة قصيرة المدى (P1)

| المهمة                                                                              | الناتج المتوقع                                                        |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| توسيع تغطية `interaction-observability` (Tier 3 Cross-cutting).                       | على الأقل 8–12 ملف اختبار يغطي القياسات الأساسية.                    |
| إضافة contract tests بين modules والـ event-bus (`ADR-036`).                          | منع كسر contracts غير المكشوف.                                       |
| رفع coverage إلى Codecov مع badge في README.                                          | مرئية الجودة للمساهمين الجدد.                                       |

### 8.3 مرحلة متوسطة المدى (P2)

| المهمة                                                                                   | الناتج المتوقع                                              |
| ---------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| دراسة جدوى mutation testing على packages الأساسية فقط.                                    | قياس kill score؛ قرار اعتماده مستقبليًا.                    |
| توثيق نمط Telegram conversation testing داخل ux-helpers.                                   | تسهيل كتابة tests للوحدات الجديدة.                          |

### 8.4 مرحلة طويلة المدى (P3)

| المهمة                                                                                   | الناتج المتوقع                                                     |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| اختبارات load + chaos engineering للـ bot-server.                                          | إثبات RPS قابل قبل خطط SaaS.                                       |
| اختبارات security (DAST) على HTTP endpoints (`/live`, `/ready`, `/webhook`).             | تحقق automated من Rule XXV chain.                                  |

## 9. خلاصة

- البنية الاختبارية **محكمة على مستوى الإطار** (Vitest projects + Inventory + Coverage policy + Boundary/Module/Auth audits في CI).
- التغطية **عالية كميًا** (0.61 test:src) لكن **غير متوازنة** بين الحزم (61 في input-engine مقابل 1 في interaction-observability).
- البوابات في CI **مكتملة بشكل أفضل من المعتاد** ولا تحتاج إضافات حرجة، فقط تحسينات هامشية (uplift في حزمة واحدة + visualization + contracts).
