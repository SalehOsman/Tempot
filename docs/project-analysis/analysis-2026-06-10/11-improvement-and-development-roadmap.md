# 11 - خارطة طريق التحسين والتطوير

> كل مقترح هنا متوافق مع منهجية SpecKit + Superpowers الحالية أو
> مع نسخة v2.5 المقترحة في `08-methodology-analysis.md`.

---

## محور 1 — تحسينات بنيوية

### 1.1 توحيد سياق الـ AI

| البند | التفاصيل |
|------|---------|
| الوصف | اعتماد `AGENTS.md` كمصدر الحقيقة، وتوليد `CLAUDE.md`/`GEMINI.md`/`.opencode/...` تلقائيًا |
| السبب | drift محتمل بين النسخ الست الحالية |
| القيمة التقنية | تقليل عبء الصيانة، اتساق سياق AI |
| الأولوية | Medium |
| التعقيد | Low |
| التنفيذ | Spec جديد `059-ai-context-source-of-truth` + script في `scripts/` |
| معيار القبول | تشغيل `pnpm context:sync` يعيد توليد كل ملفات السياق متطابقة |

### 1.2 تنظيف الجذر

تفصيل في خطة الإصلاح المرحلة 3.

### 1.3 إعادة هيكلة `docs/code-review-2025-05-18/` كأرشيف رسمي

| الوصف | نقل المراجعة القديمة إلى `docs/archive/` |
| السبب | فصل النشط عن المؤرشف |
| الأولوية | Low |
| التنفيذ | فرع `codex/docs-archive-2025-05-18` |

---

## محور 2 — تحسينات نمط الكود

### 2.1 سياسة Coverage Tiers ملزمة

تفصيل في `07-testing-and-quality-gates-analysis.md`. متضمنة في Spec #056.

### 2.2 توثيق رسمي لاستخدام `Result<T, AppError>` كنمط

| الوصف | إضافة دليل عملي في `docs/developer/result-pattern-guide.md` مع 5 أمثلة |
| السبب | تسريع تبني المطورين الجدد للنمط |
| الأولوية | Medium |
| التعقيد | Low |
| التنفيذ | تحديث وثائقي عبر فرع `codex/docs-result-pattern` |

### 2.3 سياسة AsyncLocalStorage موحدة لـ traceId

| الوصف | فرض trace context propagation عبر كل الطبقات |
| السبب | يسهل observability cross-package |
| الأولوية | Medium |
| التعقيد | Medium |
| التنفيذ | Spec جديد `061-trace-context-standard` |

---

## محور 3 — تحسينات TypeScript strictness

### 3.1 تفعيل `noUncheckedIndexedAccess`

| الوصف | إضافة `noUncheckedIndexedAccess: true` لـ `tsconfig.json` |
| السبب | حماية إضافية من undefined |
| الأولوية | Medium |
| التعقيد | High (سيكشف فجوات قائمة) |
| التنفيذ | Spec #056 امتداد |
| معيار القبول | البناء يمر بدون انحدار |

### 3.2 تفعيل `exactOptionalPropertyTypes`

| الوصف | تشديد التعامل مع `| undefined` صراحة |
| الأولوية | Low |
| التعقيد | High |
| التنفيذ | بعد 3.1 |

---

## محور 4 — تحسينات Docker

### 4.1 تثبيت قاعدة الصورة بـ digest

| الوصف | استبدال `node:22-alpine` بـ `node:22-alpine@sha256:...` |
| السبب | reproducibility |
| الأولوية | High |
| التعقيد | Low |
| التنفيذ | Spec #057 task |

### 4.2 تقليص حجم الصورة

| الوصف | إعادة هيكلة copy patterns لاستبعاد `specs/`/`packages/` غير الضرورية |
| السبب | تقليل سطح هجوم + تسريع نشر |
| الأولوية | Medium |
| التعقيد | Medium |
| التنفيذ | Spec #057 task |

### 4.3 إضافة `HEALTHCHECK` داخلية إلى Dockerfile

| الأولوية | Medium |
| التعقيد | Low |
| التنفيذ | Spec #057 |

---

## محور 5 — تحسينات CI/CD

### 5.1 سلسلة إمداد آمنة (Trivy + Cosign + SBOM)

تفصيل في خطة الإصلاح المرحلة 3.

### 5.2 CodeQL workflow

محور 6 أمن.

### 5.3 Dependabot weekly

محور 6.

### 5.4 docs-lint توسعة لـ developer/ + architecture/

| الوصف | توسيع `docs-lint.yml` ليشمل كل مجلدات التوثيق |
| الأولوية | Low |
| التعقيد | Low |
| التنفيذ | Spec #056 امتداد |

### 5.5 Build matrix على Node 22 + 24

| الوصف | تشغيل CI على إصدارين للتأكد من توافق |
| الأولوية | Medium |
| التعقيد | Low |
| التنفيذ | Spec #056 |

---

## محور 6 — تحسينات أمن

### 6.1 تفعيل CodeQL

| الأولوية | High |
| التنفيذ | Spec #056 task جديد |

### 6.2 تفعيل Dependabot

| الأولوية | High |
| التنفيذ | إضافة `.github/dependabot.yml` |

### 6.3 توثيق Secret Rotation SLA

| الأولوية | Medium |
| التنفيذ | تحديث `SECURITY.md` + `docs/operations/secret-rotation.md` |

### 6.4 DPIA لتعامل الـ user-management مع البيانات الشخصية

| الأولوية | Medium |
| التنفيذ | Spec #054 يتضمن DPIA كـ artifact إضافي |

### 6.5 سياسة CSP/headers لـ Hono endpoints

| الأولوية | Medium |
| التنفيذ | task ضمن Spec #057 |

---

## محور 7 — تحسينات اختبارات

### 7.1 E2E خفيف عبر mock Telegram

تفصيل في 07-testing.

### 7.2 Property-based tests للـ regional/national-id parsers

| الأولوية | Low |
| التعقيد | Medium |
| التنفيذ | Spec محلي للحزمة المعنية |

### 7.3 Mutation testing على الحزم الحرجة (`shared`, `auth-core`, `event-bus`)

| الأولوية | Low |
| التعقيد | High |
| التنفيذ | Spec جديد `062-mutation-testing-pilot` |

---

## محور 8 — تحسينات توثيق

### 8.1 إصلاح `pnpm docs:freshness`

في خطة الإصلاح.

### 8.2 توثيق "First Bot in 15 minutes" tutorial

| الأولوية | High |
| التعقيد | Medium |
| التنفيذ | يدخل في single-bot-template-production-readiness slice |

### 8.3 صفحة "How modules talk" مرئية في Starlight

| الأولوية | Medium |
| التنفيذ | Spec توثيقي محدد |

---

## محور 9 — تحسينات تجربة المطور

### 9.1 `setup-dev.ps1` لـ Windows

| الأولوية | Medium |
| التنفيذ | Spec #056 |

### 9.2 توسيع `pnpm tempot doctor` ليكشف:

- إصدار pnpm/Node.
- اتساق `.env` مع `.env.example`.
- Docker daemon running.

| الأولوية | Medium |
| التنفيذ | Spec جديد `063-tempot-doctor-expansion` |

### 9.3 VS Code recommended extensions في `.vscode/extensions.json`

| الأولوية | Low |
| التنفيذ | إضافة الملف |

---

## محور 10 — تحسينات إدارة الإصدارات

### 10.1 سياسة semver واضحة لكل Tier

| الأولوية | Medium |
| التنفيذ | ADR جديد + Constitution rule |

### 10.2 إصدار Tempot v0.1.0 alpha رسمي قبل remediation

| الأولوية | Low |
| التنفيذ | بعد إغلاق المرحلة 1 من خطة الإصلاح |

---

## محور 11 — تحسينات منهجية العمل (v2.5)

تفصيل في `08-methodology-analysis.md`. الأهم:

1. Production Rehearsal Gate رسمي.
2. سياسة Coverage Tiers رسمية.
3. Spec Auto-Lookup hook على PR.
4. Rotation review سنوي للقواعد.
5. AI Context Source-of-Truth.

---

## ملخص الأولويات

| المحور | عناصر High |
|-------|-----------:|
| Docker | 1 |
| CI/CD | — |
| الأمن | 2 |
| التوثيق | 1 |

كل ما هو High يدخل ضمن Specs #056/#057 الموجودة فعلًا. باقي العناصر
تصلح كـ Specs مستقبلية متسلسلة (`058`-`063`) بعد إذن PM.
