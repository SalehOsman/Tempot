# 01 - تحليل بنية المشروع

## 1. النظرة العامة

Tempot هو **pnpm monorepo** يستخدم `pnpm-workspace.yaml` لربط ثلاث مجموعات:

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'modules/*'
```

مع `packageManager: pnpm@10.33.3` و`engines.node: >=22.12.0` (`package.json`).

## 2. خريطة المجلدات الجذرية

| المسار                        | الدور                                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------------- |
| `apps/`                       | تطبيقات نهائية (bot-server + Starlight docs).                                          |
| `packages/`                   | 22 حزمة بنية تحتية وخدمات قابلة لإعادة الاستخدام.                                       |
| `modules/`                    | 9 وحدات أعمال (audit-viewer, bot-management, content-management, ...).                |
| `specs/`                      | 58 مجلد مواصفات SpecKit (`{NNN}-{feature-name}`).                                     |
| `docs/`                       | توثيق المشروع: roadmap، architecture، ADR، developer guides، تحليلات سابقة.            |
| `scripts/`                    | سكربتات CI، spec-validate، security، CLI `tempot`.                                    |
| `.specify/`                   | الدستور وإطار الأدوار وقوالب SpecKit.                                                  |
| `.github/`                    | CI/CD (3 workflows)، PR template، Funding، Issue templates.                            |
| `.husky/`                     | git hooks: pre-commit (lint-staged) + commit-msg (commitlint).                        |
| `.changeset/`                 | إصدارات Changesets (Rule LXI).                                                        |
| `.agents/` `.claude/` `.gemini/` `.opencode/` `.windsurf/` | عقود وأذونات أدوات AI متعددة.                                  |
| `coverage/`                   | مخرجات v8 coverage (محلية، لا تخضع لـ git).                                            |
| `temp/`                       | منطقة عمل مؤقتة (ضمن `.gitignore`).                                                   |

## 3. تنظيم الحزم (`packages/`)

22 حزمة، مصنفة وفق ADR-035 (Tier classification في `eslint.config.js`):

| Tier             | الحزم                                                                    |
| ---------------- | ------------------------------------------------------------------------ |
| Tier 1 Foundation | `shared`                                                                |
| Tier 2 Infrastructure | `database`, `event-bus`, `logger`, `sentry`                          |
| Tier 3 Cross-cutting | `i18n-core`, `auth-core`, `interaction-observability`                |
| Tier 4 Domain    | البقية (`ai-core`, `cms-engine`, `document-engine`, `import-engine`, `input-engine`, `module-registry`, `national-id-parser`, `notifier`, `regional-engine`, `search-engine`, `session-manager`, `settings`, `storage-engine`, `ux-helpers`) |

التصنيف يُفرَض في زمن البناء عبر `eslint-plugin-boundaries`، مع منع Tier من استدعاء Tier أعلى منه.

## 4. تنظيم الوحدات (`modules/`)

تسعة وحدات أعمال:

```
audit-viewer/  bot-management/  content-management/  help-center/
membership-management/  notification-center/  settings-management/
template-management/  user-management/
```

كل وحدة تتبع البنية المعيارية المُلمَّع إليها في `package-creation-checklist.md` و`new-module-checklist.md`:

- `commands/`, `handlers/`, `menus/`, `repositories/`, `services/`, `events/`, `features/`, `tests/`, `locales/`, `database/`, `types/`, `shared/`.
- ملفات قياس: `module.config.ts`, `module.manifest.ts`, `abilities.ts`, `deps.context.ts`, `index.ts`.
- `vitest.config.ts` لكل وحدة (Rule LXXIII).

> **ملاحظة:** بعض الوحدات تحتوي مجلد `utils/` فارغ (مثل `modules/user-management/utils/`). الـ Rule III تمنع **اسم الملف** `utils.ts`، لكنها لا تمنع المجلد بحد ذاته. وجود مجلد فارغ هو دين تنظيمي بسيط.

## 5. التطبيقات (`apps/`)

| التطبيق        | الدور                                                                          |
| -------------- | ------------------------------------------------------------------------------ |
| `bot-server`   | Hono + grammY runtime؛ يبني deps عبر `startup/deps.factory.ts` ويفوّض إلى orchestrator. |
| `docs`         | موقع التوثيق Starlight (Astro 6) مع starlight-typedoc لكل حزمة.                  |

> `bot-server/src/index.ts` مثال جيد على **Thin Shell**: لا منطق أعمال داخل entry point.

## 6. مواصفات SpecKit

58 مواصفة تتراوح من #001 (database-package) إلى #058 (bot-access-mode-membership-gate). كل مواصفة تحتوي (نموذجيًا):

- `spec.md`, `plan.md`, `tasks.md`, `data-model.md`, `research.md`, `checklists/`.

> الإحصاء يكشف ترقيمًا مستمرًا (#001..#058) مع فجوة عند #022 و#033 (لا توجد مجلدات لهذا الرقم — يجب التحقق منه لاحقًا إن كان مقصودًا).

## 7. وضوح فصل الطبقات

- **Apps → Packages → Modules** بفروقات اعتمادية واضحة.
- **Modules → Packages**: عبر `peerDependencies` (مثال: `modules/user-management/package.json` يفصل الاعتمادية الواقعية إلى peer).
- **Modules ↛ Modules**: الحزمة `eslint-plugin-boundaries` + Rule XV يمنعان الاستيراد المتبادل بين الـ modules.
- **Services ↛ Prisma**: عبر `BaseRepository` فقط (Rule XIV).

## 8. الملفات المهمة على الجذر

| الملف                          | الدور                                                                     |
| ------------------------------ | ------------------------------------------------------------------------- |
| `package.json`                 | سكربتات Monorepo، pnpm overrides أمنية، lint-staged، dev/build/test.       |
| `pnpm-workspace.yaml`          | تعريف الـ workspace + allowBuilds + security overrides.                    |
| `pnpm-lock.yaml`               | قفل الإصدارات (موجود ومتزامن).                                            |
| `tsconfig.json`                | base TS config (strict + NodeNext).                                       |
| `eslint.config.js`             | تطبيق Rules I, II, III, VIII, X, LXXIV + boundaries (ADR-035).             |
| `.prettierrc`                  | تنسيق الكود.                                                              |
| `commitlint.config.js`         | Conventional Commits (Rule IV).                                            |
| `vitest.config.ts`             | 4 vitest projects: unit, integration, application, e2e.                   |
| `vitest.config.base.ts`        | `baseExclude` المشترك.                                                    |
| `docker-compose.yml`           | bot + Postgres pgvector + Redis مع healthchecks.                          |
| `.env.example`                 | مرجع متغيرات البيئة بشكل واضح ومُقَسَّم.                                   |
| `.gitignore`                   | شامل (يستبعد `.env` كلها ما عدا `.example`، ويستبعد artifacts JS في src).  |
| `AGENTS.md` / `CLAUDE.md` / `GEMINI.md` | عقود سياق لأدوات AI متعددة (Rule XLVIII).                          |
| `CONTRIBUTING.md`              | يلزم بقراءة Constitution + Roles + Workflow.                              |
| `SECURITY.md`                  | سياسة الإفصاح عن الثغرات.                                                 |
| `CHANGELOG.md`                 | مولّد عبر Changesets (Rule LXI).                                          |

## 9. نقاط القوة

| البند                          | الدليل                                                                       |
| ------------------------------ | ---------------------------------------------------------------------------- |
| فصل صارم بين apps/packages/modules | `pnpm-workspace.yaml` + `eslint.config.js` (boundaries).                  |
| تطبيق tiered architecture على الحزم | ADR-035 + `boundaries/elements` و`boundaries/dependencies`.            |
| ترقيم خطي للمواصفات (#001..#058) | `specs/` — يوفّر تتبعًا سرديًا للقرارات.                                    |
| إصدارات حزم Major.Minor مدارة عبر Changesets | `.changeset/` + workflow في CI.                                    |
| دستور هندسي مكتوب يحكم البنية | `.specify/memory/constitution.md` v2.5.0 (90 قاعدة).                         |
| توثيق منفصل للمعمارية والـ ADR والمطورين | `docs/architecture/`, `docs/developer/`, `docs/architecture/adr/`.    |

## 10. نقاط الضعف

| البند                                                                          | الخطورة | الدليل                                                                |
| ------------------------------------------------------------------------------ | ------- | --------------------------------------------------------------------- |
| `apps/bot-server/src/bot-server.types.js` (11 بايت `export {};`) داخل src.       | Medium  | يخالف Rule LXXVIII (`find src/ -name "*.js"` يجب أن يكون فارغًا).    |
| مجلد `utils/` فارغ داخل وحدات (مثل `user-management/utils/`).                   | Low     | بقايا scaffolding غير محذوفة (Rule VIII).                            |
| ملف `.env` حقيقي محلي مكتظ بأسرار فعلية (BOT_TOKEN، Super Admin IDs).            | Medium  | على المطور حصرًا؛ غير مدفوع إلى git.                                |
| كثرة عقود الـ AI Tools في الجذر (`.agents/`, `.claude/`, `.gemini/`, `.opencode/`, `.windsurf/`, `.specify/`, `.understand-anything/`). | Low     | مقبول لكنه يضيف ضوضاء بصرية على الـ root.                         |
| مجلد `temp/` على الجذر — مستبعد عبر `.gitignore` لكنه قد يكون مصدر تشتت لمطور جديد. | Low     | مفيد أن يكون داخل `.local/` أو موثقًا.                              |
| فجوة في ترقيم specs (#022، #033 مفقودان).                                       | Low     | يجب توثيق سبب الإلغاء أو إعادة الرقم.                                 |

## 11. خلاصة

البنية واضحة، متماسكة، ومحكومة بدستور وملفات إعداد تعكس التصميم — وهي من أفضل الأنماط لمشاريع TypeScript Monorepo. الديون التنظيمية البسيطة (artifacts صغيرة، utils فارغ، فجوات ترقيم specs) يمكن إغلاقها ضمن branch صغير `codex/tidy-tree` يمرّ بدورة Spec→Plan→Tasks مختصرة لأنها لا تمسّ سلوكًا إنتاجيًا.
