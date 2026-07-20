# 08 - تحليل منهجية العمل

## هل توجد منهجية موثقة؟

نعم، موثقة بدرجة استثنائية:

| المرجع | الدور |
|--------|-------|
| `.specify/memory/constitution.md` (~31KB، 90 قاعدة) | السلطة الأعلى |
| `.specify/memory/roles.md` (~5.5KB) | إطار الأدوار الثلاثي |
| `AGENTS.md`, `CLAUDE.md`, `GEMINI.md` | سياق متعدد الأدوات |
| `CONTRIBUTING.md` | بوابات الجودة وسير العمل |
| `docs/developer/workflow-guide.md` | الدليل العملي |
| `docs/ROADMAP.md` | المصدر الوحيد لحالة التقدم |
| `docs/superpowers/` | 14 دليل لأدوات Superpowers |
| `specs/` | 50 مجلد عقد متطلبات تنفيذي |
| `docs/developer/package-creation-checklist.md` | قائمة مرجعية |
| `docs/developer/new-module-checklist.md` | قائمة مرجعية |
| `docs/developer/module-flow-governance.md` | حوكمة تدفق الوحدات |

## مكونات المنهجية الفعلية

```
┌──────────────────────────────────────────────────────────────┐
│  Constitution (90 rules)  +  Roles (PM, TA, Executor)       │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│  SpecKit  →  spec.md, plan.md, research.md, data-model.md,   │
│              tasks.md, checklist + speckit-analyze gate      │
└──────────────────────────────────────────────────────────────┘
                              ↓ Handoff Gate
┌──────────────────────────────────────────────────────────────┐
│  Superpowers → brainstorming, worktrees, plans, TDD,        │
│                 review, verification, finishing branch       │
└──────────────────────────────────────────────────────────────┘
                              ↓ Quality Gates
┌──────────────────────────────────────────────────────────────┐
│  CI: methodology, lint, typecheck, unit, integration, audit │
│  Local: pnpm boundary:audit, module:checklist, cms:check    │
└──────────────────────────────────────────────────────────────┘
                              ↓
                   Merge into main + ROADMAP update
```

## الأدوار الثلاثة

| الدور | الجهة | الصلاحية |
|------|------|---------|
| Project Manager | إنسان | اتخاذ قرار، إذن تنفيذ |
| Technical Advisor | AI (افتراضي عند قراءة AGENTS.md) | تحليل وتخطيط، لا يعدّل بدون إذن صريح |
| Executor | AI | تنفيذ بعد تفويض، وفق Specs |

هذا الفصل واضح نادر في مشاريع AI-assisted، ويقلل فعليًا من الأخطاء.

## تصنيف المنهجية

**واضحة وموثقة**.

## تقييم الالتزام بالمنهجية (مستوى المشروع)

| البعد | الملاحظة | التقييم |
|------|----------|---------|
| وضوح خطوات التطوير | ممتاز عبر workflow-guide + Specs | 95% |
| انتظام بنية المشروع | ممتاز (Tiers + Modules) | 95% |
| معايير كود | مطبقة ميكانيكيًا (ESLint + Prettier) | 92% |
| وجود اختبارات | شامل لكن apps خارج CI الجذر | 80% |
| توثيق متزامن | غني، لكن `docs:freshness` مكسور | 80% |
| مراجعة جودة | موثقة عبر Superpowers + checklist | 88% |
| توافق Docker مع التطوير | جيد، لكن نقص توقيع/SBOM | 75% |
| توافق scripts مع دورة العمل | ممتاز | 92% |
| سهولة دخول المطور الجديد | ONBOARDING + tempot init + doctor | 88% |

**التقييم الإجمالي للالتزام بالمنهجية**: **88%**

السبب الرئيسي للنقص: تأخر تنفيذ Specs #053-#057 رغم اكتمال SpecKit
gates (artifact-level). أي المشروع التزم بالـ "تخطيط" ولم يلتزم بعد
بـ "التنفيذ" لتلك الشريحة الحرجة.

## تقييم المنهجية نفسها

| البعد | التقييم | السبب |
|-------|---------|-------|
| ملاءمتها لحجم المشروع | 95% | متناسبة مع 23 حزمة + 8 وحدات |
| قابلية التوسع | 90% | الـ Specs النمطية تستوعب نموًا |
| البساطة | 75% | تعدد الأدوات (SpecKit + Superpowers + Constitution + Workflow) قد يثقل المشروع الصغير لكنه مبرر هنا |
| الوضوح | 90% | الأدوار + الـ Gates معرّفة |
| القابلية للتطبيق | 85% | تم تطبيقها على 50 spec |
| دعم الجودة | 95% | بوابات متعددة |
| دعم الأمان | 80% | يحتاج SAST + supply chain |
| دعم النشر | 75% | runbook موجود لكن لا rehearsal/blue-green |
| دعم التطوير المرحلي | 90% | Phases + Roadmap |
| تقليل الفوضى التقنية | 90% | Constitution + ADR + checklist |

**التقييم الإجمالي لجودة المنهجية**: **90%**

## نقاط القوة في المنهجية

1. الفصل بين "وثيقة قرار" (Constitution/ADR) و"تنفيذ" (Specs).
2. التطبيق الميكانيكي للقواعد (ESLint boundaries، spec:validate،
   module:checklist) بدلًا من الاتفاقيات الإنسانية فقط.
3. إطار الأدوار الثلاثي يقلل من تنفيذ AI أحادي الجانب.
4. ROADMAP كمصدر وحيد للحقيقة، يُحدث بعد كل merge.
5. التزام واضح بالـ Conventional Commits + Changesets.

## نقاط الخلل في المنهجية

| الخلل | الأثر | اقتراح التطوير |
|------|------|------------------|
| لا يوجد التزام مفروض آليًا بأن كل ميزة تبدأ من Spec قبل أن يفتح فرع كود | يمكن لفرع كود أن ينشأ بلا spec.md | hook مستودعي يمنع PRs بدون spec ID |
| السقف 200 سطر/ملف يدفع أحيانًا لتقسيم اصطناعي | تبديد إدراكي | استثناءات صريحة لـ entry orchestrators |
| التكرار بين `AGENTS.md`, `CLAUDE.md`, `GEMINI.md` | مخاطرة drift | ملف SOURCE OF TRUTH واحد + شفافية أن باقي الملفات منسوخة منه |
| غياب Step-Definition for Production Go-Live (rehearsal/blue-green) | جاهزية إنتاج ناقصة | إضافة قسم "Production Rehearsal Gate" إلى Constitution |
| لا rotation review للقواعد الـ 90 (هل لا تزال تطبق؟ هل تحتاج تقاعد؟) | تضخم قواعد | مراجعة دورية سنوية للدستور |

## هل المنهجية مناسبة لطبيعة المشروع؟

نعم. Tempot منتج إطار عمل مفتوح لمستخدمين تقنيين ينتظرون استقرار
معاقد + قابلية امتداد. منهجية شديدة الانضباط هي بالضبط ما يحتاجه
هذا النوع من المنتجات. الخطر الوحيد هو إبطاء الإصلاحات الصغيرة بسبب
عبء الإجراء، لكن هذا مخفف بفروع `codex/repo-hygiene`-style خفيفة.

## كيف يجب أن تتم الإصلاحات والتطويرات وفق هذه المنهجية

1. كل إصلاح أو تطوير يبدأ من Spec موجود (Specs #053-#057) أو من Spec
   جديد ضمن `specs/{NNN}-{name}/`.
2. Spec يمر بـ Handoff Gate (artifacts + analyze + spec:validate).
3. تنفيذ في فرع `codex/{slug}` أو worktree.
4. TDD: RED → GREEN → REFACTOR.
5. مراجعة عبر Superpowers `requesting-code-review`.
6. تحقق عبر بوابات الجودة المناسبة لنطاق التغيير.
7. Reconciliation Gate: `pnpm spec:validate` + `pnpm cms:check`.
8. Merge فقط بعد كل ما سبق.

## التحسين المقترح للمنهجية (نسخة v2.5)

| التحسين | السبب | التطبيق |
|---------|------|---------|
| Production Rehearsal Gate كقاعدة جديدة في الدستور | لتوحيد متطلبات الانتقال للإنتاج | Spec #057 + ADR جديد |
| سياسة Coverage Tiers رسمية | لإغلاق فجوة الاختبار الحالية | Spec #056 |
| Spec Auto-Lookup hook على PR | منع PRs بدون spec | Spec #056 |
| مراجعة دورية سنوية للدستور (rule rotation) | منع تضخم القواعد | إضافة Rule جديدة |
| توحيد سياق الـ AI عبر تضمين تلقائي بدلًا من تكرار يدوي | تقليل drift | حقل `extends:` في AGENTS.md |
