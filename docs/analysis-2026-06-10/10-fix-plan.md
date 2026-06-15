# 10 - خطة الإصلاح المرحلية

> **تحديث 2026-06-15:** تم تنفيذ والتحقق من Spec #053 وأساس Spec #056 على
> فرع المصالحة. الخطوة التالية هي أساس Spec #055، وليس القطع المدمر لـ Spec
> #054. أي migration أو cutover أو key rotation في Spec #054 يتطلب موافقة
> مستقلة وصريحة. تبقى تغطية Spec #056 غير مكتملة: 23 فشلًا حاجبًا و9 تحذيرات.

> الخطة مبنية بالكامل على Specs #053-#057 الموجودة فعلًا في
> `specs/`، بحيث لا يُفتح مسار تنفيذي خارج المنهجية. كل مرحلة تشير
> إلى Spec واحد على الأقل، ويمر تنفيذها بـ Handoff Gate و Superpowers.

---

## المرحلة 1 — عاجلة (1-2 أسبوع)

### الهدف

استعادة سلامة التفويض الوظيفي ورؤية CI لتطبيق `bot-server`.

### المهام

| #   | المهمة                                                             | Spec | المرجع  |
| --- | ------------------------------------------------------------------ | ---- | ------- |
| 1   | تنفيذ Spec #053 (Authorization Correction)                         | #053 | ISS-001 |
| 2   | إدراج `apps/bot-server` و `apps/docs` في `vitest projects` الجذرية | #056 | ISS-003 |
| 3   | إصلاح الفشلين المعروفين في `apps/bot-server/tests`                 | #056 | ISS-003 |

### الترتيب

#053 ثم شريحة CI من #056 معًا (لا تتعارض شفرتهما عادة). يبدأ
المنفذ بـ #053 على فرعه المخصص، وموازيًا تخطيط شريحة #056 للـ CI.

### المخاطر

- تغيير قواعد CASL قد يكسر اختبارات قائمة → معالجة عبر TDD.
- إدراج apps في vitest قد يكشف فشل إضافي → خطة احتواء بـ Spec #056.

### معايير القبول

- المستخدم العادي يمكنه التفاعل مع البوت.
- `pnpm test:unit` على CI يفشل قبل إصلاح الـ 2 ثم ينجح.
- لا انحدار في صلاحيات SUPER_ADMIN/ADMIN.

### طريقة التحقق

`pnpm lint`, `pnpm build`, `pnpm test:unit`, `pnpm test:integration`,
`pnpm spec:validate`, مراجعة Superpowers (`requesting-code-review`).

### العلاقة بالمنهجية

كاملة: Spec → Plan → TDD → Review → Verification → Reconciliation → Merge.

---

## المرحلة 2 — قصيرة المدى (2-4 أسابيع)

### الهدف

إغلاق فجوة حماية البيانات الشخصية وتكامل البيانات.

### المهام

| #   | المهمة                                                                         | Spec |
| --- | ------------------------------------------------------------------------------ | ---- |
| 1   | تنفيذ Spec #054 (Sensitive Data Protection) — تشفير، lookup tokens، redaction  | #054 |
| 2   | rehearsal لـ migration على بيئة staging قبل تطبيقها على prod                   | #054 |
| 3   | تنفيذ Spec #055 (Data Integrity Hardening) — atomicity, soft-delete invariants | #055 |

### الترتيب

#054 أولًا (لا تطبيق production حقيقي قبلها). #055 بعدها لأن atomicity
يستفيد من تثبيت بنية البيانات الجديدة.

### المخاطر

- ترحيل بيانات تاريخية: غير قابل للعكس بسهولة.
- تدوير المفاتيح: يتطلب runbook موثق + اختبار recovery.

### معايير القبول

- لا حقول حساسة plaintext في DB أو في audit JSON.
- تحديث متعدد الحقول ذرّي (transaction shell).
- soft-delete invariants مفروضة على repo level.
- migration verified في staging مع backup/restore.

### طريقة التحقق

- لقطة قاعدة قبل/بعد على staging.
- اختبارات integration لـ atomicity (فشل جزئي → rollback كامل).
- مراجعة DevSecOps + DBA-equivalent.

### العلاقة بالمنهجية

تتطلب ADR جديد لاختيارات التشفير (key derivation، storage). كل ذلك
ضمن Specs الحالية.

---

## المرحلة 3 — متوسطة المدى (1-2 شهر)

### الهدف

استكمال بوابات الجودة وتقوية سلسلة إمداد الصورة.

### المهام

| #   | المهمة                                                                         | Spec                                         |
| --- | ------------------------------------------------------------------------------ | -------------------------------------------- |
| 1   | استكمال Spec #056: Coverage tiers ملزمة، toolchain conformance، docs freshness | #056                                         |
| 2   | إضافة Trivy/Grype + Cosign + Syft SBOM إلى docker workflow                     | #057                                         |
| 3   | تفعيل CodeQL + Dependabot                                                      | Spec #056 task                               |
| 4   | إضافة `packageManager` في `package.json`                                       | Spec #056                                    |
| 5   | توحيد إصدار Node بين CI/Dockerfile/engines                                     | Spec #056                                    |
| 6   | تنظيف الجذر (`bot-terminal.log`, `project_status_report.md`, `.gitkeep`)       | فرع `codex/repo-hygiene` (تابع لـ Spec #056) |
| 7   | إضافة `setup-dev.ps1`                                                          | Spec #056 DX task                            |

### الترتيب

التوازي ممكن لأن المهام لا تتعارض في ملفات.

### المخاطر

- coverage thresholds قد تكشف فجوات مفاجئة → إدخال تدريجي tier-by-tier.
- container scan قد يكشف CVEs جديدة → إعداد سياسة معالجة.

### معايير القبول

- `pnpm test:coverage` يفشل عند الكسر تحت الحد الأدنى لكل tier.
- صورة Docker موقعة + SBOM منشور + Trivy report attached.
- CodeQL يعمل ويُبلِّغ عن findings.
- ملف `packageManager` موجود.
- بيئات Node موحدة.

### طريقة التحقق

CI logs + GHCR registry inspection + cosign verify.

### العلاقة بالمنهجية

كل المهام موزعة على Specs #056 و #057 الحاليتين. لا spec جديد مطلوب.

---

## المرحلة 4 — طويلة المدى (2-4 أشهر)

### الهدف

جاهزية إنتاج كاملة + تطوير منهجية v2.5.

### المهام

| #   | المهمة                                                                                                          | المسار                                      |
| --- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| 1   | استكمال Spec #057 (deployment runbook، rehearsal، rollback automation، startup hardening)                       | Spec #057                                   |
| 2   | اختبار E2E خفيف عبر mock Telegram                                                                               | Spec #056 امتداد                            |
| 3   | matrix testing لـ `TEMPOT_*` flag combinations (nightly)                                                        | Spec #056 امتداد                            |
| 4   | تحديث Constitution v2.5 لإدراج "Production Rehearsal Gate" + "Coverage Tier Policy" + "Docs Freshness Required" | Spec جديد `058-constitution-v2.5`           |
| 5   | استبدال تكرار سياق AI بـ ملف source-of-truth + sync تلقائي                                                      | Spec جديد `059-ai-context-source-of-truth`  |
| 6   | rotation review للقواعد الـ 90 — تقاعد ما لم يعد قابلًا للتطبيق                                                 | Spec جديد `060-constitution-rules-rotation` |

### الترتيب

#057 ضرورية قبل go-live. باقي المهام تتم بالتوازي بعد إذن PM.

### المخاطر

- تعديل الدستور يؤثر على كل التنفيذ المستقبلي → مراجعة عميقة.
- اختبارات E2E تتطلب بنية mock telegram دقيقة.

### معايير القبول

- Production Go/No-Go meeting يصدر "Go" بناء على بوابة #057.
- E2E يعمل في CI nightly.
- Constitution v2.5 معتمد ومنشور مع change log.

### طريقة التحقق

- staging rehearsal كامل: deploy → migrate → smoke → rollback.
- مراجعة سنوية موثقة للـ rule rotation.

### العلاقة بالمنهجية

تتمم المنهجية وتعزز ذاتها — تطوير ذاتي مرتب.

---

## الملخص الزمني

| المرحلة | المدة المتوقعة | المخرج الرئيسي                    |
| ------- | -------------- | --------------------------------- |
| 1       | 1-2 أسبوع      | تفويض سليم + رؤية CI كاملة        |
| 2       | 2-4 أسابيع     | بيانات شخصية مشفرة + تكامل بيانات |
| 3       | 1-2 شهر        | بوابات جودة + سلسلة إمداد آمنة    |
| 4       | 2-4 أشهر       | جاهزية إنتاج + منهجية v2.5        |

كل مرحلة تخضع لـ Quality Gates (Spec → Plan → TDD → Review →
Verification → Reconciliation → Merge) بدون استثناء.
