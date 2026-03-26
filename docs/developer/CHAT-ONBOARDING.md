<div dir="rtl">

# دليل تهيئة المحادثة — Tempot

> **هذا الملف:** يُلصق في بداية أي محادثة جديدة (Claude Desktop, claude.ai, أو أي AI)
> لتعريف الـ AI بالمشروع ومنهجيته فوراً.
>
> **ملف السياق الكامل:** `CLAUDE.md` (لـ Claude Code) أو `GEMINI.md` (لـ Gemini CLI)

---

## كيف تستخدم هذا الملف

### على Claude Code (CLI):

**لا تحتاج هذا الملف.** Claude Code يقرأ `CLAUDE.md` تلقائياً ولديه SpecKit + Superpowers مثبتين.

### على Claude Desktop أو claude.ai:

**الصق النص التالي** في أول رسالة، أو ارفع ملف `CLAUDE.md` مباشرة:

</div>

---

```
أنا أعمل على مشروع Tempot — Enterprise Telegram bot framework بـ TypeScript Strict Mode.

المرجع الأعلى: constitution.md في .specify/memory/ (87 قاعدة).
المواصفات المعمارية: docs/tempot_v11_final.md (v11.0).
خارطة الطريق: docs/ROADMAP.md

المنهجية:
- SpecKit يُنتج المواصفات (specify → clarify → plan → analyze → tasks)
- Superpowers يستهلك المواصفات وينفّذ (brainstorming → worktree → plans → execute → review → merge)
- بينهما "بوابة تسليم": يجب وجود spec.md + plan.md + tasks.md قبل التنفيذ
- TDD إلزامي (RED → GREEN → REFACTOR)
- لا كود بدون spec. لا كود بدون اختبار أولاً.
- لا تطوير على main. كل feature في branch معزول.

المرحلة الحالية: Phase 1 — الحزمة التالية: session-manager rebuild.

القواعد الحرجة: Result Pattern (neverthrow)، Repository Pattern، Event-Driven، i18n-Only، No any types.

المراجع:
- SpecKit: https://github.com/github/spec-kit
- Superpowers: https://github.com/obra/superpowers
- الدستور: constitution Rules LXXIX–LXXXIX تحكم المنهجية
```

<div dir="rtl">

### على Gemini CLI:

**لا تحتاج هذا الملف.** Gemini CLI يقرأ `GEMINI.md` تلقائياً ولديه أوامر SpecKit في `.gemini/commands/`.

---

## متى تحتاج هذا الملف؟

| السيناريو                             | تحتاج هذا الملف؟                           |
| ------------------------------------- | ------------------------------------------ |
| تطوير عبر Claude Code على المشروع     | ❌ لا — يقرأ CLAUDE.md تلقائياً            |
| تطوير عبر Gemini CLI على المشروع      | ❌ لا — يقرأ GEMINI.md تلقائياً            |
| استشارة على Claude Desktop عن المشروع | ✅ نعم — الصق النص أعلاه                   |
| استشارة على claude.ai عن المشروع      | ✅ نعم — الصق النص أو ارفع CLAUDE.md       |
| مراجعة كود مع AI خارجي                | ✅ نعم — الصق النص + ارفع الملفات المطلوبة |

</div>
