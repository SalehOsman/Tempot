# 08 - تحليل منهجية العمل

## 1. هل توجد منهجية موثقة؟

نعم. منهجية Tempot **موثَّقة بشكل صريح وواسع**، بل وتمتلك ميزات نادرة جدًا في مشاريع TypeScript:

| الوثيقة                                       | الدور                                                                                   |
| --------------------------------------------- | --------------------------------------------------------------------------------------- |
| `.specify/memory/constitution.md` (v2.5.0)    | 90 قاعدة دستورية مرقمة تحكم البناء.                                                     |
| `.specify/memory/roles.md` (v1.2.0)           | إطار الأدوار الثلاث (Project Manager + Technical Advisor + Executor).                  |
| `AGENTS.md` / `CLAUDE.md` / `GEMINI.md`       | عقود سياق لأدوات AI متعددة، تُلزمها بقراءة الدستور والأدوار قبل أي فعل.                  |
| `CONTRIBUTING.md`                             | تسلسل التدفق المطلوب لكل تغيير إنتاجي (9 خطوات).                                        |
| `docs/developer/workflow-guide.md`            | الدليل العملي.                                                                          |
| `docs/developer/package-creation-checklist.md`| 10 نقاط مطلوبة لكل package جديد.                                                       |
| `docs/developer/new-module-checklist.md`      | قائمة وحدة جديدة.                                                                       |
| `docs/architecture/adr/`                      | 45 ADR موثَّق.                                                                          |
| `docs/ROADMAP.md`                             | المصدر الوحيد لحالة المشروع.                                                            |

## 2. ماهية المنهجية

المنهجية الفعلية لـ Tempot هي **SpecKit + Superpowers** مع **Three-Role Framework** و**Constitution**.

### 2.1 SpecKit (مرحلة المواصفات)

```
specify → spec.md (بدون tech stack)
clarify → spec.md (بلا [NEEDS CLARIFICATION])
plan → plan.md + data-model.md + research.md
checklist → checklists/*.md (اختياري لكنه مستحب)
analyze → فحص الاتساق الداخلي
tasks → tasks.md
```

> SpecKit `implement` **غير مستخدَم** عمدًا — الـ Superpowers يُنفّذ.

### 2.2 Handoff Gate

قبل أن يبدأ Superpowers، يجب توفر:

- `spec.md` بلا `[NEEDS CLARIFICATION]`.
- `plan.md`, `tasks.md`, `data-model.md`, `research.md`.
- `/speckit.analyze` بلا critical.
- `pnpm spec:validate` بلا critical (باستثناء deferred per Rule XC).

### 2.3 Superpowers (مرحلة التنفيذ)

```
brainstorming → using-git-worktrees → writing-plans
   → subagent-driven-development (أو executing-plans)
   → requesting-code-review → verification-before-completion
   → finishing-a-development-branch
```

### 2.4 إطار الأدوار

```
Technical Advisor ─prompt→ Project Manager ─prompt→ Executor
       ▲                          │                     │
       └────── result review ─────┴───── result report ─┘
```

- Project Manager هو المحور الوحيد (لا تواصل مباشر بين Advisor و Executor).
- Technical Advisor يكتب prompts كاملة موجَّهة (Rule prompt writing في `roles.md`).
- Executor يلتزم بالـ prompt تمامًا.
- لا أحد يعدّل ملفات إلا بإذن صريح من Project Manager.

### 2.5 الـ Quality Gates

| Gate              | متى                  | المعيار                                                                  |
| ----------------- | --------------------- | ------------------------------------------------------------------------ |
| Spec Gate         | بعد clarify           | acceptance criteria + edge cases موثَّقة.                                |
| Plan Gate         | بعد analyze           | `/speckit.analyze` بلا critical.                                         |
| Handoff Gate      | قبل brainstorming     | كل artifacts موجودة.                                                     |
| TDD Gate          | أثناء التنفيذ         | RED → GREEN → REFACTOR.                                                  |
| Review Gate       | بعد review            | لا critical.                                                              |
| Reconciliation Gate | قبل merge            | `pnpm spec:validate` بلا critical.                                       |
| Merge Gate        | قبل finish            | كل التيستات + معايير القبول مرّت.                                        |

## 3. تقييم الالتزام بالمنهجية

**التقييم: 88%**

| البند                                                                                            | الالتزام   | الدليل                                                                                            |
| ------------------------------------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------- |
| Specs موجودة لكل feature/package/module                                                          | 95%        | 58 spec في `specs/`، مع فجوتي ترقيم (#022, #033).                                                  |
| `pnpm spec:validate` في CI Methodology Gates                                                     | 100%       | `.github/workflows/ci.yml`.                                                                       |
| Git workflow لا يطور على main مباشرة                                                              | 100%       | الفرع الحالي `codex/058-bot-access-mode-membership-gate`، آخر merge على main عبر PR.              |
| Branch naming `codex/...`                                                                         | 100%       | جميع الفروع المحلية تتبع النمط.                                                                    |
| Conventional Commits                                                                              | 100%       | commitlint + Husky commit-msg + سجل commits يثبت الالتزام.                                        |
| Changesets لكل feature/fix                                                                        | 95%        | `.changeset/membership-access-mode.md` و`user-management-telegram-id-lookup.md` موجودان.            |
| TDD سواء عبر RED-first                                                                            | 80%        | غير قابل للقياس آليًا، لكن وجود 357 ملف test مقابل 588 src يدلّ على ثقافة test-first.            |
| Documentation sync (Rule L)                                                                       | 85%        | ROADMAP محدَّث 2026-06-20، لكن `CONTRIBUTING.md` يذكر pnpm 11 (تعارض مع ROADMAP).                  |
| ADR لكل قرار معماري                                                                                | 95%        | 45 ADR موثَّق. SaaS-readiness لم يحصل بعد على ADR منفصل (موجود بـ markdown فقط).                  |
| لا `any`/`@ts-ignore`/`eslint-disable`                                                            | 95%        | 2 eslint-disable في `webhook-manager.ts` فقط — انتهاك واحد محدود.                                  |
| لا hardcoded user-facing text                                                                     | 95%        | Rule XLIII مفروض عبر `pnpm cms:check`، لا hardcoded ar/en في .ts.                                  |
| Tests بالإنجليزية                                                                                  | 100%       | عينة عشوائية تؤكد.                                                                                |
| Modules لا تستورد بعضها                                                                            | 100%       | `pnpm boundary:audit`.                                                                           |
| Services لا تستخدم Prisma مباشرة                                                                  | 100%       | `import-boundary-prisma-audit.ts`.                                                                 |
| Three-role framework محترم                                                                         | 90%        | يدويًا — يعتمد على انضباط Project Manager. الأدوات (Codex/Claude/Gemini) معدّة لذلك.               |
| Roadmap محدث بعد كل merge                                                                          | 95%        | ROADMAP تحت تحديث منتظم.                                                                          |

## 4. تقييم جودة المنهجية نفسها

**التقييم: 92%**

| المعيار                                          | التقييم    | الملاحظات                                                                                  |
| ------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------ |
| ملاءمتها لحجم المشروع (22 pkg + 9 mod + 58 spec) | ممتاز      | المنهجية مصمَّمة لمشاريع enterprise، وهذا المقاس يستفيد منها فعلًا.                          |
| قابلية التوسع                                     | ممتاز      | كل package/module جديد يدخل عبر checklist + spec + ADR — نمط متعدد القابل للتوسع.            |
| البساطة                                          | متوسط     | 90 قاعدة دستورية + ثلاث أدوار + سلسلتي أدوات (SpecKit + Superpowers) منهجية ثقيلة لمشروع صغير، لكنها متناسبة لهذا الحجم. |
| الوضوح                                            | ممتاز      | كل قاعدة مرقمة، مرجعة في PRs، وموثقة في ADRs.                                                  |
| قابلية التطبيق                                    | ممتاز      | معظم القواعد مفروضة آليًا (ESLint، CI gates، spec:validate، lint-staged).                    |
| دعم الجودة                                        | ممتاز      | بوابات coverage + boundary + authorization + module checklist.                              |
| دعم الأمان                                        | جيد جدًا   | Rule XXV chain موثق، supply chain hardening، protected data keys.                            |
| دعم النشر والتشغيل                                | جيد جدًا   | Docker workflow + signing + scanning + healthchecks + graceful shutdown.                    |
| دعم التطوير المرحلي                              | ممتاز      | Specs + Phases + ROADMAP + Changesets.                                                       |
| تقليل الفوضى التقنية                              | ممتاز      | banned filenames، dependency rule، تنظيم Tiered.                                            |

### 4.1 نقاط القوة الفريدة

1. **Three-Role Framework** بشري + AI Reviewer + AI Executor — نموذج فعلي للعمل مع AI tools بانضباط.
2. **Constitution مرقم بـ 90 قاعدة** مع `MAJOR.MINOR.PATCH` versioning — معاملة الدستور كـ code itself.
3. **SpecKit + Superpowers** بدلًا من `/speckit.implement` يفصل النية عن التنفيذ، ويسمح بمراجعة الـ design قبل أي كود.
4. **بوابات Methodology قبل بوابات الكود في CI** — يضمن أن المواصفات والكود متّسقان لا منفصلان.
5. **runtime-manifest** يربط النشر بالمواصفات في زمن البناء.
6. **`pnpm tempot` CLI** يدمج init + doctor + module create — يقصّر منحنى التعلم.

### 4.2 نقاط الضعف

| البند                                                                                                | الخطورة |
| ---------------------------------------------------------------------------------------------------- | ------- |
| ثقل المنهجية على مساهم خارجي قصير الزمن — يحتاج قراءة 90 قاعدة + Workflow Guide قبل أي PR.            | Medium  |
| Three-Role Framework يعتمد على انضباط بشري كامل؛ لا يوجد فرض آلي للحفاظ على المحور الوحيد.            | Low     |
| التعدد في عقود سياق AI (`.agents/`, `.claude/`, `.gemini/`, `.opencode/`, `.windsurf/`) يُكرّر العمل عند تحديث Rules. | Low     |
| فجوات ترقيم Specs (#022, #033 مفقودان) دون توثيق سبب الإلغاء.                                         | Low     |
| `CONTRIBUTING.md` يذكر pnpm 11 بينما ROADMAP يحدد 10.33.3 — تعارض documentation drift صغير.            | Low     |

## 5. هل المنهجية مناسبة لطبيعة المشروع؟

**نعم بقوة.** مبرّرات:

- المشروع `enterprise Telegram bot framework` بقاعدة كود متوسطة/كبيرة (~590 ملف src + 357 ملف test).
- المشروع متعدد المساهمين (`SalehOsman` + أدوات AI متعددة كـ "Executors").
- الإخراج النهائي MIT-licensed framework يُستخدم في الإنتاج → الانضباط يحمي ميزة الـ extensibility والـ stability.

> منهجية أخفّ لمشروع بهذا الحجم كانت ستؤدي إلى entropy خلال 6 أشهر. منهجية أثقل لمشروع أصغر كانت ستكون overkill. الحالي **متناسب بشكل غير شائع**.

## 6. اقتراح تطوير المنهجية (incremental)

> لا يُهدف إلى استبدال المنهجية بل تخفيف نقاط الاحتكاك دون كسر أيٍّ من قواعدها.

### 6.1 تطويرات مقترحة (P1)

| المقترح                                                                                                   | الفائدة                                                                          |
| --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| إضافة `docs/developer/methodology-quick-reference.md` (~2 صفحة) ل onboarding سريع.                          | تقليل زمن تأهيل مساهم جديد من ساعات إلى دقائق دون فقد العمق.                    |
| دمج عقود سياق AI في ملف واحد قابل للتضمين (مثل `AGENTS.md` مصدر، والباقي ينسخ منه عبر سكربت).                | يمنع drift بين CLAUDE.md و GEMINI.md عند تحديث rule.                            |
| إضافة `pnpm methodology:status` يفحص ROADMAP/specs/changesets ويطبع dashboard موجز.                          | يحوّل الالتزام إلى مرئي محلّيًا.                                                |
| توثيق Specs الملغاة (#022, #033) في ROADMAP مع سبب الإلغاء وتاريخه.                                          | شفافية تاريخية.                                                                  |

### 6.2 تطويرات مقترحة (P2)

| المقترح                                                                                                       | الفائدة                                                              |
| ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| كتابة ADR رسمي للـ Three-Role Framework يربطه بـ ADR-040 (Tempot Core / Cloud boundary).                     | يربط البنية الإدارية بالبنية التقنية بشكل صريح.                       |
| إنشاء قالب prompt قابل لإعادة الاستخدام لكل نوع spec (feature/bugfix/docs/refactor) في `.specify/templates/`. | يحسّن إنتاجية Technical Advisor.                                      |
| إضافة `verification-checklist.md` لكل دور (Project Manager / Technical Advisor / Executor) كقائمة مراجعة سريعة. | يحوّل الـ roles من نص إلى عملية يومية.                                |

### 6.3 تطويرات مقترحة (P3)

| المقترح                                                                                          | الفائدة                                                            |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| تطوير `pnpm tempot spec lint` يفحص spec واحد ضد قائمة checks (لا [NEEDS CLARIFICATION]، تواجد plan، ...) | بوابة pre-handoff قابلة للتنفيذ محليًا.                              |
| تطوير ADR template مع YAML frontmatter قابل للقراءة آليًا.                                       | يمكّن `docs:claims` من فحوص أعمق.                                  |
| اعتماد changeset templates ل-feat/fix/docs/security.                                              | يقلل التشتت في كتابة CHANGELOG.                                    |

## 7. كيف يجب أن تتم الإصلاحات والتطويرات وفق هذه المنهجية؟

كل توصية في هذه السلسلة من التقارير يجب أن تمر عبر التالي بدون استثناء:

1. **توصيف SpecKit:** افتح `specs/{NNN}-{kebab-name}/` (تابع لسلسلة الـ specs)؛ ابدأ بـ `/speckit.specify`.
2. **توضيح:** `/speckit.clarify` حتى لا يبقى `[NEEDS CLARIFICATION]`.
3. **تخطيط:** `/speckit.plan` ينتج `plan.md` + `data-model.md` + `research.md`.
4. **Checklist:** `/speckit.checklist` للأبعاد المتخصصة (Quality, Security, UX, DX, ...).
5. **Analyze:** `/speckit.analyze` يفحص الاتساق (يجب يصير صفر critical).
6. **Tasks:** `/speckit.tasks` يولّد breakdown منتظم.
7. **Handoff:** `pnpm spec:validate` نقي. لا critical issues.
8. **Branch isolation:** `git worktree` (Rule LXXXV).
9. **Brainstorming + Writing-plans** (Superpowers).
10. **Executing-plans أو subagent-driven-development** مع TDD صارم.
11. **Requesting-code-review** عبر prompt جديد من Technical Advisor إلى Executor.
12. **Receiving-code-review** + إصلاحات.
13. **Verification-before-completion** (أوامر فعلية + مخرجات).
14. **Documentation Sync (Rule L):** تحديث specs + ROADMAP + ADR + CLAUDE/GEMINI + Architecture spec + Changeset.
15. **Finishing-a-development-branch:** merge أو PR.

> أي تجاوز لهذه السلسلة هو انتهاك لـ Rule XLIX (No Skip Rule). الاستثناء الوحيد هو Hotfix Track (Rule LXXXVII) لـ P0/P1 production bugs، مع spec retroactive خلال 48 ساعة.

## 8. خلاصة

المنهجية في Tempot هي **الميزة المعمارية الأقوى للمشروع** — أوضح من الكود نفسه، وأسبق منه في النضج. التوصيات في هذه التقارير كلها يمكن تنفيذها داخل إطارها بدون كسر، وستزداد فعالية المنهجية بإضافات صغيرة في الـ DX دون توسيع الـ rule set.
