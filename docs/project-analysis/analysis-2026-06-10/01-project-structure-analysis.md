# 01 - تحليل بنية المشروع

## نظرة عامة

Tempot هو pnpm Monorepo يتبع تقسيمًا ثلاثي الطبقات واضحًا:

```
apps/        → واجهات تشغيلية (bot-server, docs)
packages/    → خدمات بنية تحتية مُعاد استخدامها (23 حزمة)
modules/     → قدرات تجارية (8 وحدات أعمال)
specs/       → 50 مجلد SpecKit للميزات والحزم والوحدات
docs/        → توثيق المنتج، المطور، المعمارية، والأرشيف
.specify/    → الدستور وأطر الأدوار وقوالب SpecKit
.github/     → CI: ci.yml, docker.yml, docs-lint.yml + قوالب
scripts/     → أدوات حوكمة (boundary audit, module checklist, spec validate, tempot CLI)
```

## إحصاء سريع (من القراءة المباشرة)

| العنصر | العدد |
|--------|------:|
| تطبيقات في `apps/` | 2 (`bot-server`, `docs`) |
| حزم في `packages/` | 23 |
| وحدات في `modules/` | 8 |
| مجلدات Specs | 50 |
| ملفات إعدادات حوكمة في الجذر | `eslint.config.js`, `tsconfig.json`, `pnpm-workspace.yaml`, `commitlint.config.js`, `.prettierrc`, `vitest.config.ts`, `vitest.config.base.ts` |

## ملفات الجذر المهمة ودورها

| الملف | الدور | ملاحظة |
|-------|------|---------|
| `package.json` | منسق Monorepo، scripts للجودة والتشغيل | لا يحدد `packageManager` رغم أن CI يثبّت pnpm 11 |
| `pnpm-workspace.yaml` | تعريف workspaces + overrides أمنية صريحة | overrides جيدة لـ CVEs (`devalue`, `esbuild`, `@hono/node-server`, `protobufjs`, `tmp`) |
| `tsconfig.json` | إعدادات TS صارمة (`strict: true`, NodeNext) | `noEmit: true` على مستوى الجذر فقط؛ كل package يبني محليًا |
| `eslint.config.js` | يطبق قواعد الدستور (no-any, max-lines, no-console، حدود الحزم 4 طبقات) | تطبيق ممتاز لـ ADR-035 |
| `docker-compose.yml` | تشغيل محلي + خدمة `bot-server` للنشر | يحتوي تعليق "TODO Phase 5" متناقض مع الواقع (الخدمة موجودة فعلًا) |
| `AGENTS.md`, `CLAUDE.md`, `GEMINI.md` | سياق متعدد الأدوات للذكاء الاصطناعي | تكرار في المحتوى لكنه مقصود لتعدد العملاء |
| `project_status_report.md` | تقرير حالة في الجذر | **يفترض نقله إلى `docs/project-analysis/`** |
| `bot-terminal.log` | سجل تشغيلي ~58KB | **لا يجب أن يكون في المستودع** |

## تقييم التنظيم

### نقاط القوة

- **فصل طبقي صريح ومُنفذ ميكانيكيًا**: قواعد `eslint-plugin-boundaries`
  تمنع الاستيراد عبر الطبقات (Foundation → Infrastructure → Cross-cutting →
  Domain). هذا أقوى من أغلب المشاريع المماثلة التي تكتفي بالاتفاقيات
  الإنسانية.
- **حدود الوحدات**: كل `modules/*` تحتوي بنية موحدة
  (`commands/`, `handlers/`, `services/`, `repositories/`, `types/`,
  `locales/`, `tests/`, `module.config.ts`, `module.manifest.ts`) — مثال:
  `modules/user-management/`.
- **أدوات حوكمة آلية**: `scripts/ci/import-boundary-audit.cli.ts`،
  `scripts/ci/module-package-checklist-audit.ts`،
  `scripts/spec-validate/`، وأدوات تطوير `pnpm tempot ...`.
- **تجانس أنماط المنتج**: كل وحدة لديها README مختصر وملف Manifest.
- **توثيق متعدد المستويات**: `docs/architecture/` (تشمل 44 ADR)،
  `docs/developer/`، `docs/operations/`، `docs/product/`، `docs/security/`،
  `docs/superpowers/`.

### نقاط الضعف

| البند | الدليل |
|-------|--------|
| ملفات تشغيل في الجذر يجب استبعادها | `bot-terminal.log` (~58KB)، `project_status_report.md` |
| تكرار سياق الأدوات يصعب صيانته | `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.gemini/`, `.claude/`, `.opencode/`, `.agents/` |
| تعليق Phase 5 قديم في `docker-compose.yml:13` يناقض وجود الخدمة | الملف نفسه |
| مجلد فارغ في `packages/.gitkeep` بقيمة 28 بايت — لا حاجة له بعد امتلاء الحزم | `packages/.gitkeep` |
| `temp/`, `coverage/`, `.understand-anything/` كمجلدات في الجذر | يفترض أن يضمن `.gitignore` عدم تتبعها (موجود)؛ المشكلة فقط في الفوضى البصرية |

## وضوح الفصل بين الطبقات

| الطبقة | محتوى نموذجي | استيرادات مسموحة |
|--------|--------------|--------------------|
| Tier 1 Foundation | `packages/shared` | لا شيء من `@tempot/*` |
| Tier 2 Infrastructure | `database`, `event-bus`, `logger`, `sentry` | Tier 1 + Tier 2 |
| Tier 3 Cross-cutting | `i18n-core`, `auth-core`, `interaction-observability` | Tier 1 + Tier 2 |
| Tier 4 Domain | باقي الحزم + `modules/*` | Tier 1 + Tier 2 + Tier 3 (ولا تستورد بين الوحدات) |

التطبيق الفعلي عبر ESLint قوي ومرئي ضمن `eslint.config.js:20-126`.

## التقييم النهائي

- **التنظيم العام**: 88%
- **وضوح الفصل بين الطبقات**: 95%
- **نظافة الجذر**: 65%
- **التجانس داخل الحزم/الوحدات**: 90%

## التوصية المنهجية

أي تنظيف لبنية الجذر (إزالة `bot-terminal.log`، نقل `project_status_report.md`،
حذف `packages/.gitkeep`) يتم عبر فرع توثيقي منفصل (`codex/repo-hygiene-cleanup`)
ويعامل كتغيير توثيقي لا يحتاج TDD لكنه يحتاج مراجعة، وفق
`docs/developer/workflow-guide.md`.
