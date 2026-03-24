# SpecKit + Gemini CLI — Quick Reference

> **الدليل الكامل:** `docs/developer/workflow-guide.md`
> **المرجع الدستوري:** Rules L–LX in `constitution.md`

## حل مشكلة `Feature directory not found`

SpecKit يبحث عن مجلد باسم الـ branch الحالي. المشروع يستخدم مجلدات مرقمة. الحلول:

**الحل 1 — متغير البيئة (الأبسط):**
```powershell
$env:SPECIFY_FEATURE = "007-i18n-core-package"
/speckit.tasks
/speckit.analyze
```

**الحل 2 — تسمية الـ branch لتتطابق:**
```bash
git checkout -b feat/007-i18n-core-package
# SpecKit يجد specs/007-i18n-core-package/ تلقائياً
```

## ملاحظة عن `init-options.json`

```json
{ "ai": "gemini", "ai_skills": false, "speckit_version": "0.3.1" }
```

`ai_skills: false` يعني أن SpecKit لا يستخدم skills extensions. هذا مقصود — الـ skills تأتي من Superpowers وليس من SpecKit.
