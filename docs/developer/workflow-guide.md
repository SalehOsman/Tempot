<div dir="rtl">

# دليل المنهجية — SpecKit + Superpowers

> **المرجع الدستوري:** المواد LXXIX–LXXXIX من `constitution.md`
> **آخر تحديث:** 2026-03-25
> **هذا هو الدليل العملي الوحيد. لا يوجد دليل آخر.**

---

## الفكرة الأساسية

SpecKit يكتب المواصفات. Superpowers ينفّذها. لا يتكرران — يتكاملان.

```
SpecKit يُنتج:                    Superpowers يستهلك:
  spec.md (ماذا ولماذا)    ──→     brainstorming يقرأ ويعمّق
  plan.md (كيف تقنياً)      ──→     brainstorming يتحقق ويسأل
  tasks.md (المهام)         ──→     writing-plans يفصّل للدقائق
                                    subagent-driven-development ينفّذ
                                    requesting-code-review يراجع
                                    finishing-a-development-branch يدمج
```

---

## الخطوة 0 — بروتوكول إنشاء الحزمة (إلزامي قبل أي شيء)

> **المرجع الدستوري:** المواد LXXI–LXXVIII
> **قائمة التحقق:** `docs/developer/package-creation-checklist.md`

قبل البدء بأي مواصفات أو كود لحزمة جديدة، يجب أن تمر الحزمة بـ **10 نقاط إلزامية**.
هذا البروتوكول يمنع تكرار مشاكل البنية الجوهرية (مثل حادثة 172 artifact في 2026-03-24).

### هيكل الحزمة الإلزامي

كل حزمة جديدة يجب أن تحتوي على هذه الملفات قبل أي كود:

```
packages/{name}/
├── src/
│   └── index.ts
├── tests/
│   └── unit/
├── .gitignore          ← يتضمن dist/, src/**/*.js, src/**/*.d.ts
├── package.json        ← main/types→dist/, exports, build script, exact versions
├── tsconfig.json       ← outDir: "dist", rootDir: "src" (أو "." إذا وُجد tests/)
└── vitest.config.ts    ← vitest 4.1.0 exact
```

### قائمة التحقق السريعة (10 نقاط)

افتح `docs/developer/package-creation-checklist.md` وتحقق من كل نقطة قبل كتابة
أول سطر كود.

### منهجية التنفيذ الإلزامية (Superpowers Sequence)

كل حزمة جديدة تُنفَّذ **حصراً** عبر هذا التسلسل — لا اختصارات:

| #   | الأداة                           | الهدف                         | المخرج                                    |
| --- | -------------------------------- | ----------------------------- | ----------------------------------------- |
| 1   | `brainstorming`                  | تعميق التصميم التقني          | `docs/superpowers/specs/{date}-{name}.md` |
| 2   | `using-git-worktrees`            | بيئة عمل معزولة               | branch + worktree                         |
| 3   | `writing-plans`                  | مهام 2-5 دقائق                | `docs/superpowers/plans/{date}-{name}.md` |
| 4   | `subagent-driven-development`    | تنفيذ TDD                     | كود + اختبارات                            |
| 5   | `requesting-code-review`         | مراجعة ضد spec + constitution | تقرير المراجعة                            |
| 6   | `verification-before-completion` | التحقق النهائي                | تقرير التحقق                              |
| 7   | `finishing-a-development-branch` | الدمج                         | merge إلى main                            |

**تخطي أي خطوة = رفض الحزمة عند المراجعة.**

---

## مرحلة المواصفات (SpecKit)

### 1. كتابة المواصفات

```powershell
$env:SPECIFY_FEATURE = "007-i18n-core-package"
```

```
/speckit.specify أريد بناء حزمة i18n-core التي توفر نظام ترجمة
متعدد اللغات للبوت مع دعم Arabic كلغة أساسية
```

**قاعدة ذهبية:** اذكر "ماذا ولماذا" فقط. لا تذكر أي تقنية (لا Prisma ولا Redis ولا i18next).

**المخرج:** `specs/007-i18n-core-package/spec.md`

### 2. التوضيح

```
/speckit.clarify
```

الـ AI يسألك أسئلة متتابعة عن الحالات الحدية والغموض. أجب بصراحة. إذا لا تعرف، قل "لا أعرف" وسيقترح خيارات.

**ممنوع التخطي.** هذه الخطوة تكشف المشاكل قبل كتابة سطر كود واحد.

### 3. الخطة التقنية

```
/speckit.plan سنستخدم i18next 25.x مع TypeScript strict mode،
الترجمات تُخزّن كـ JSON في packages/i18n-core/locales/،
Arabic primary + English secondary
```

**هنا فقط** تذكر الـ tech stack.

**المخرجات:** `plan.md` + `data-model.md` + `research.md`

### 4. التحقق من الجودة (اختياري لكن موصى به)

```
/speckit.checklist
```

يولّد قوائم تحقق لمجالات محددة (UX, أمان, أداء). إذا وجدت `[Gap]`، أصلحه في `spec.md` ثم حدّث الخطة.

### 5. فحص التناسق

```
/speckit.analyze
```

يفحص هل المواصفات والخطة والمهام متسقة. **يجب أن يمر بدون أخطاء حرجة.**

### 6. تقسيم المهام

```
/speckit.tasks
```

**المخرج:** `tasks.md` — هذا هو العقد الذي يُسلّم لـ Superpowers.

---

## بوابة التسليم

قبل الانتقال لـ Superpowers، تحقق:

- [ ] `spec.md` موجود ولا يحتوي `[NEEDS CLARIFICATION]`
- [ ] `plan.md` موجود مع قرارات تقنية واضحة
- [ ] `tasks.md` موجود مع مهام مرتبة
- [ ] `/speckit.analyze` مرّ بدون أخطاء حرجة

**أي خانة فارغة = لا تبدأ Superpowers.**

---

## مرحلة التنفيذ (Superpowers)

### 7. العصف الذهني

```
/brainstorming

أريد تصميم حزمة i18n-core حسب المواصفات في
specs/007-i18n-core-package/spec.md
```

Superpowers يقرأ `spec.md` + `plan.md` ثم يسأل أسئلة سقراطية **تقنية** — لا يعيد كتابة المواصفات بل يعمّقها على مستوى التنفيذ.

**المخرج:** `docs/superpowers/specs/{date}-i18n-core-design.md`

### 8. بيئة عمل معزولة

Superpowers ينشئ git worktree تلقائياً بعد الموافقة على التصميم.

### 9. خطة التنفيذ

```
/writing-plans
```

يقرأ `tasks.md` من SpecKit + design doc من الخطوة السابقة ويحولهما إلى مهام 2-5 دقائق مع مسارات ملفات وكود كامل.

**المخرج:** `docs/superpowers/plans/{date}-i18n-core.md`

### 10. التنفيذ

**على Claude Code:**

```
/subagent-driven-development
```

هذا هو الوضع المطلوب — يرسل subagent لكل مهمة مع مراجعة ثنائية (تطابق المواصفات ← جودة الكود).

**على Gemini CLI:**

```
/executing-plans
```

**TDD إلزامي في كل مهمة:**

- 🔴 اكتب اختبار يفشل
- 🟢 اكتب أقل كود لنجاحه
- 🔵 حسّن بدون تغيير السلوك
- ✅ commit

### 11. مراجعة الكود

```
/requesting-code-review
```

المراجعة تفحص ضد `spec.md` والدستور. صفر مشاكل حرجة مطلوب.

عند استلام ملاحظات: `/receiving-code-review` لمعالجتها منهجياً.

### 12. التحقق النهائي

```
/verification-before-completion
```

كل الاختبارات + كل acceptance criteria + فحص regressions.

### 13. الدمج

```
/finishing-a-development-branch
```

بعد الدمج: حدّث `docs/ROADMAP.md`.

---

## أدوات إضافية أثناء التنفيذ

| الموقف          | الأداة                                                            |
| --------------- | ----------------------------------------------------------------- |
| خطأ غامض        | `/systematic-debugging` — 4 مراحل: أدلة → فرضيات → اختبار → إصلاح |
| تتبع عكسي للخطأ | `root-cause-tracing`                                              |
| مشكلة توقيت     | `condition-based-waiting`                                         |
| عمل متوازي      | `/dispatching-parallel-agents`                                    |

---

## حل مشكلة SpecKit مع المجلدات المرقّمة

SpecKit يبحث عن مجلد باسم الـ branch. المشروع يستخدم مجلدات مرقمة. الحل:

```powershell
$env:SPECIFY_FEATURE = "007-i18n-core-package"
```

هذا يُعيّن قبل أي أمر SpecKit ويوجهه للمجلد الصحيح.

</div>
