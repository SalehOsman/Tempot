# 09 - سجل المشكلات والمخاطر

> **ملاحظة:** هذا السجل يفصّل المشكلات الموثقة بأدلة فعلية من المستودع. كل صف يحدد ما إذا كان الحل متوافقًا مع منهجية SpecKit + Superpowers الحالية، وكيف يجب تنفيذه ضمنها.

## I001 — bot-server.types.js داخل src (Rule LXXVIII)

| البند                          | التفاصيل                                                                                                                |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| المشكلة                        | ملف `bot-server.types.js` (محتواه `export {};`) موجود داخل `apps/bot-server/src/`.                                       |
| الدليل                         | `F:\Tempot\apps\bot-server\src\bot-server.types.js` (مستبعد بـ `.gitignore` لكنه على القرص).                              |
| التصنيف                        | Clean Workspace (Rule LXXVIII).                                                                                          |
| الخطورة                        | Medium                                                                                                                  |
| الأثر                          | يخالف صراحة "find src/ -name *.js يجب أن يكون فارغًا". قد يربك TypeScript module resolution لاحقًا.                       |
| السبب المحتمل                  | بقايا tsc emit من تجربة سابقة أو ts-node compile.                                                                      |
| الحل المقترح                   | حذف الملف. التأكد أن `outDir` في `apps/bot-server/tsconfig.json` يشير إلى `dist/`، لا `.`.                              |
| الأولوية                       | P1                                                                                                                      |
| متوافق مع المنهجية الحالية؟    | نعم                                                                                                                     |
| طريقة التنفيذ وفق المنهجية     | spec سريع `059-cleanup-stale-artifacts` (أو إدراج المهمة في spec أكبر للتنظيف)؛ branch `codex/cleanup-stale-artifacts`؛ commit `chore(bot-server): remove stale .js artifact`؛ verify بـ `find apps/bot-server/src -name "*.js"`. |
| معيار القبول                   | `find` لا يُرجع شيئًا؛ `pnpm build` يمر؛ `pnpm test:unit` يمر.                                                            |

## I002 — eslint-disable في webhook-manager.ts (Rule I)

| البند                          | التفاصيل                                                                                                              |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| المشكلة                        | استخدام `/* eslint-disable no-console */` و`/* eslint-disable max-lines-per-function */` على رأس السكربت.              |
| الدليل                         | `apps/bot-server/scripts/webhook-manager.ts:1-2`.                                                                     |
| التصنيف                        | Rule I (No eslint-disable bypass).                                                                                    |
| الخطورة                        | Medium                                                                                                                |
| الأثر                          | يخالف الدستور حرفيًا حتى وإن كان ملف CLI خارج `src/`.                                                                |
| السبب المحتمل                  | حاجة السكربت للـ `console.log` (CLI feedback) ولدوال طويلة (switch case).                                              |
| الحل المقترح                   | استبدال `console.*` بـ `startupLogger` (موجود في `@tempot/logger`)؛ تقسيم الـ `main()` إلى دوال محصّلة (set/info/delete handlers) لتفادي تجاوز 50 سطر. |
| الأولوية                       | P1                                                                                                                    |
| متوافق مع المنهجية؟            | نعم                                                                                                                   |
| طريقة التنفيذ                  | spec سريع كجزء من `059-cleanup-stale-artifacts` أو spec فرعي؛ TDD على الـ exit codes؛ verify بـ `pnpm lint`.            |
| معيار القبول                   | `pnpm lint` يمر دون أي eslint-disable في الملف.                                                                       |

## I003 — تعليقات بالعربية في ملفات الإنتاج (Rule XL)

| البند                          | التفاصيل                                                                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| المشكلة                        | تعليقات وJSDoc بالعربية في ملفات `.ts` إنتاجية (37 سطرًا في 9+ ملفات).                                                          |
| الدليل                         | `modules/user-management/abilities.ts:1-10`، `packages/input-engine/src/fields/numbers/arabic-numerals.helper.ts:1-3`، وغيرها. |
| التصنيف                        | Rule XL (Everything developers see in English).                                                                                |
| الخطورة                        | Medium                                                                                                                         |
| الأثر                          | يصعّب code review الخارجي ويناقض ثقافة الكود الموثقة.                                                                            |
| السبب المحتمل                  | شفافية للمساهم العربي لكنها مخالفة دستورية.                                                                                    |
| الحل المقترح                   | ترجمة جميع التعليقات إلى الإنجليزية مع الإبقاء على معنى التعليق.                                                                 |
| الأولوية                       | P1                                                                                                                             |
| متوافق مع المنهجية؟            | نعم                                                                                                                            |
| طريقة التنفيذ                  | spec doc-only (Rule L documentation sync)؛ commit `docs(code-comments): translate Arabic comments to English`؛ verify يدوي + grep لأكواد UTF-8 ضمن 0600-06FF خارج locales. |
| معيار القبول                   | فحص بـ `Select-String -Pattern '[\u0600-\u06FF]'` على src يُرجع صفرًا في ملفات `.ts` خارج المسارات المسموح بها (مثل عينات اختبار). |

## I004 — `.env` محلي يحوي أسرارًا حية

| البند                          | التفاصيل                                                                                                |
| ------------------------------ | ------------------------------------------------------------------------------------------------------- |
| المشكلة                        | ملف `F:\Tempot\.env` يحوي `BOT_TOKEN` و`SUPER_ADMIN_IDS` بقيم حية.                                       |
| الدليل                         | فحص محلي للحجم (5786 بايت) + قراءة جزئية.                                                                |
| التصنيف                        | Operational secret hygiene.                                                                              |
| الخطورة                        | High (على مستوى المطور المنفرد)                                                                          |
| الأثر                          | عند تسرب الجهاز أو نشر screenshot، تتسرب الـ token.                                                       |
| السبب المحتمل                  | تطوير محلي طبيعي.                                                                                       |
| الحل المقترح                   | (a) توثيق دورة تدوير BOT_TOKEN؛ (b) ضمان عدم وجود `.env` في أي backup أو cloud sync؛ (c) دراسة استخدام Doppler/1Password CLI لـ injection. |
| الأولوية                       | P0 (تشغيلي)                                                                                              |
| متوافق مع المنهجية؟            | نعم — يدخل ضمن security spec.                                                                            |
| طريقة التنفيذ                  | spec `059-security-hardening-followups` (مقترح)؛ تطبيق على مستوى documentation + runbook في `docs/security/`. |
| معيار القبول                   | runbook موجود يحدد تدوير الـ token كل 90 يوم؛ نقطة فحص في `pnpm tempot doctor`.                          |

## I005 — `pnpm 11 or newer` في CONTRIBUTING.md متعارض مع `10.33.3` في package.json

| البند                          | التفاصيل                                                                                                              |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| المشكلة                        | `CONTRIBUTING.md` السطر 18 يذكر `pnpm 11 or newer`، بينما `package.json` يثبت `packageManager: pnpm@10.33.3` ووثيقة ROADMAP تصحح ذلك. |
| الدليل                         | `CONTRIBUTING.md:18` + `package.json:4` + `docs/ROADMAP.md` (تصحيح 2026-06-15).                                       |
| التصنيف                        | Documentation drift (Rule L).                                                                                         |
| الخطورة                        | Low                                                                                                                   |
| الأثر                          | مساهم جديد يثبّت pnpm 11، يواجه عدم توافق Node 22.12 → احتكاك تجربة-مطور.                                              |
| السبب المحتمل                  | المستند سبق التصحيح.                                                                                                  |
| الحل المقترح                   | تحديث `CONTRIBUTING.md` ليطابق `packageManager`.                                                                       |
| الأولوية                       | P2                                                                                                                    |
| متوافق مع المنهجية؟            | نعم — doc-only.                                                                                                       |
| طريقة التنفيذ                  | spec docs-only أو دمج في `056` follow-up؛ commit `docs(contributing): align pnpm version with package.json`.           |
| معيار القبول                   | grep `pnpm 11` لا يُرجع شيئًا في `CONTRIBUTING.md`؛ النص يطابق `packageManager`.                                       |

## I006 — `coverage-summary.json` غير موجود محليًا

| البند                          | التفاصيل                                                                                                              |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| المشكلة                        | `pnpm test:coverage` يستهلك `coverage/coverage-summary.json` لكن الملف غير موجود محليًا، فقط `coverage-final.json`.    |
| الدليل                         | `Get-ChildItem F:\Tempot\coverage -Filter '*summary*'` لا يُرجع شيئًا.                                                  |
| التصنيف                        | Quality gate local visibility.                                                                                        |
| الخطورة                        | Medium                                                                                                                |
| الأثر                          | البوابة الـ blocking تعمل في CI لكن لا يمكن للمطور التأكد محليًا قبل الـ push.                                          |
| السبب المحتمل                  | reporter `json-summary` معرّف في `vitest.config.ts` لكن قد لم يُولَّد بسبب فشل سابق.                                     |
| الحل المقترح                   | إعادة تشغيل `pnpm test:coverage` نظيفًا. إذا استمرت المشكلة، تحقق أن `@vitest/coverage-v8: 4.1.0` يولّد `json-summary`. |
| الأولوية                       | P1                                                                                                                    |
| متوافق مع المنهجية؟            | نعم                                                                                                                   |
| طريقة التنفيذ                  | spec `059-coverage-local-visibility`؛ tasks: تحديث `vitest.config.ts` (إن لزم)، إضافة تعليمات للـ workflow-guide.        |
| معيار القبول                   | بعد `pnpm test:coverage`، يوجد `coverage/coverage-summary.json` ويعمل `scripts/ci/coverage-policy.ts` محليًا.            |

## I007 — `interaction-observability` ضعيف الاختبار

| البند                          | التفاصيل                                                                                                              |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| المشكلة                        | الحزمة Tier 3 Cross-cutting تحتوي ملف اختبار واحد فقط.                                                                 |
| الدليل                         | inventory: `interaction-observability: 1 test files`.                                                                 |
| التصنيف                        | Coverage gap.                                                                                                         |
| الخطورة                        | Medium                                                                                                                |
| الأثر                          | حزمة شائعة الاستخدام (Cross-cutting) قد تكسر بصمت → blast radius كبير (Rule LIV).                                       |
| السبب المحتمل                  | حداثة الحزمة (Spec #051 — interaction-observability-package).                                                          |
| الحل المقترح                   | إضافة 8–12 ملف اختبار يغطي: capture، redaction، event correlation، edge cases عند Redis degradation.                    |
| الأولوية                       | P1                                                                                                                    |
| متوافق مع المنهجية؟            | نعم                                                                                                                   |
| طريقة التنفيذ                  | spec `059-test-coverage-uplift` (مقترح) أو إعادة فتح Spec #051 بـ remediation tasks؛ TDD صارم.                          |
| معيار القبول                   | tests count ≥ 8، وعتبات coverage تنطبق على هذه الحزمة specifically.                                                    |

## I008 — `utils/` فارغة في user-management

| البند                          | التفاصيل                                                                                       |
| ------------------------------ | ---------------------------------------------------------------------------------------------- |
| المشكلة                        | مجلد `modules/user-management/utils/` فارغ.                                                    |
| الدليل                         | `Get-ChildItem` يُظهر مجلد فارغ.                                                                |
| التصنيف                        | Rule VIII (No zombie code/scaffolding).                                                         |
| الخطورة                        | Low                                                                                            |
| الأثر                          | تشويش بصري ودعوة لاحقة لإنشاء `utils.ts` (Rule III banned).                                     |
| السبب المحتمل                  | scaffolding بعد `pnpm tempot module create`.                                                    |
| الحل المقترح                   | حذف المجلد؛ تحديث module template ل لا يُنشئه افتراضيًا.                                       |
| الأولوية                       | P2                                                                                             |
| متوافق مع المنهجية؟            | نعم                                                                                            |
| طريقة التنفيذ                  | spec فرعي في `037-module-tooling-foundation` متابعة أو spec جديد `059-cleanup-stale-artifacts`. |
| معيار القبول                   | المجلد محذوف؛ القالب المحدَّث لا يُنشئه.                                                       |

## I009 — فجوات ترقيم specs (#022, #033)

| البند                          | التفاصيل                                                                                  |
| ------------------------------ | ----------------------------------------------------------------------------------------- |
| المشكلة                        | لا مجلد `specs/022-*` أو `specs/033-*`.                                                  |
| الدليل                         | `Get-ChildItem F:\Tempot\specs -Directory` يُظهر الفجوة.                                 |
| التصنيف                        | Documentation drift (Rule L).                                                             |
| الخطورة                        | Low                                                                                       |
| الأثر                          | يصعّب الاستقصاء السردي للقرارات.                                                          |
| السبب المحتمل                  | spec ابتُدئت ثم أُلغيت ولم يُسجَّل سبب الإلغاء.                                            |
| الحل المقترح                   | توثيق الإلغاء في `docs/ROADMAP.md` تحت قسم "Cancelled Specs".                              |
| الأولوية                       | P3                                                                                        |
| متوافق مع المنهجية؟            | نعم                                                                                       |
| طريقة التنفيذ                  | docs-only commit.                                                                          |
| معيار القبول                   | قسم "Cancelled Specs" موجود ويغطي #022 و#033 بسبب وتاريخ.                                  |

## I010 — Docker compose dev passwords ثابتة

| البند                          | التفاصيل                                                                                                                |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| المشكلة                        | `POSTGRES_PASSWORD: tempot_password` ثابتة في `docker-compose.yml`.                                                     |
| الدليل                         | `docker-compose.yml:72`.                                                                                                |
| التصنيف                        | Operational hygiene.                                                                                                    |
| الخطورة                        | Low (dev-only)                                                                                                          |
| الأثر                          | لو نُسخ الـ compose دون قراءة ⇒ خطر إنتاج.                                                                              |
| السبب المحتمل                  | تبسيط تجربة المطور الأول.                                                                                                |
| الحل المقترح                   | تحويلها إلى `${POSTGRES_PASSWORD:-tempot_password}` مع تحذير صريح في README و`docker-compose.yml` تعليقي.                |
| الأولوية                       | P2                                                                                                                      |
| متوافق مع المنهجية؟            | نعم                                                                                                                     |
| طريقة التنفيذ                  | spec فرعي في `057-production-delivery-hardening` follow-up أو spec سريع.                                                 |
| معيار القبول                   | كلمة المرور تأتي من env var بقيمة افتراضية؛ Compose docs تحذر صراحة.                                                    |

## I011 — لا فحص secrets في CI (gitleaks/trufflehog)

| البند                          | التفاصيل                                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------------------- |
| المشكلة                        | لا يوجد job يفحص commits أو PR للأسرار المسرَّبة.                                                  |
| الدليل                         | `.github/workflows/` لا يحتوي gitleaks.                                                          |
| التصنيف                        | Defense-in-depth.                                                                                  |
| الخطورة                        | Medium                                                                                            |
| الأثر                          | الاعتماد فقط على `.gitignore` لمنع تسريب `.env` — لا يحمي من lapse بشري.                            |
| السبب المحتمل                  | ميزة غير مدرجة بعد.                                                                                |
| الحل المقترح                   | إضافة gitleaks job في `ci.yml` بـ `fetch-depth: 0`.                                               |
| الأولوية                       | P0                                                                                                |
| متوافق مع المنهجية؟            | نعم                                                                                               |
| طريقة التنفيذ                  | spec `059-security-hardening-followups`؛ ADR قصير لاختيار gitleaks؛ tasks: إضافة workflow + توثيق.  |
| معيار القبول                   | gitleaks step موجود ويفشل عند pattern طروء؛ يمر على main current بدون مشاكل.                       |

## I012 — Spec #057 لم يُغلق نهائيًا

| البند                          | التفاصيل                                                                                                              |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| المشكلة                        | T032 staging smoke + backup/restore على بيانات هدف + go/no-go log غير مكتمل.                                          |
| الدليل                         | `docs/ROADMAP.md` (2026-06-20) — جدول Production Readiness Remediation Program.                                       |
| التصنيف                        | Production readiness.                                                                                                 |
| الخطورة                        | High (تشغيلي)                                                                                                          |
| الأثر                          | لا يمكن إصدار `v1.0` بنشر إنتاجي مدعوم بأدلة.                                                                          |
| السبب المحتمل                  | تطلبات gates خارجية (staging حقيقي).                                                                                  |
| الحل المقترح                   | إكمال Phases 5-7 من Spec #057 وفق منهجية SpecKit + Superpowers، تسجيل أدلة في `docs/operations/`.                       |
| الأولوية                       | P0                                                                                                                    |
| متوافق مع المنهجية؟            | نعم                                                                                                                   |
| طريقة التنفيذ                  | متابعة Spec #057 الحالي. لا spec جديد.                                                                                |
| معيار القبول                   | ROADMAP يعكس Spec #057 = Complete؛ go/no-go log منشور في `docs/operations/`.                                          |

## I013 — Spec #058 (bot-access-mode-membership-gate) قيد التطوير على branch محلي

| البند                          | التفاصيل                                                                                       |
| ------------------------------ | ---------------------------------------------------------------------------------------------- |
| المشكلة                        | 57 ملفًا معدلًا + 9 ملفات untracked على الفرع المحلي.                                          |
| الدليل                         | `git status` على فرع `codex/058-bot-access-mode-membership-gate`.                              |
| التصنيف                        | Work in progress.                                                                              |
| الخطورة                        | Low (متوقع — لكن سعة الـ diff مدعاة لمراجعة Rule IX).                                          |
| الأثر                          | كلما زاد حجم الـ diff، صعب الـ review.                                                          |
| السبب المحتمل                  | spec كبير يستدعي تعديلات عبر apps + modules + packages.                                          |
| الحل المقترح                   | فحص الـ tasks في `specs/058-bot-access-mode-membership-gate/` للتأكد من الالتزام بـ Rule IX، وتجزئة الـ PR إن أمكن. |
| الأولوية                       | P1                                                                                             |
| متوافق مع المنهجية؟            | نعم                                                                                            |
| طريقة التنفيذ                  | يستمر تنفيذ Spec #058 عبر Superpowers مع إمكانية stacked PRs.                                   |
| معيار القبول                   | الـ PR يدمج بدون reverts بعد review.                                                            |

## I014 — تكرار عقود سياق AI

| البند                          | التفاصيل                                                                                                |
| ------------------------------ | ------------------------------------------------------------------------------------------------------- |
| المشكلة                        | `AGENTS.md` + `CLAUDE.md` + `GEMINI.md` تتضمن نسخًا متشابهة جدًا من نفس القواعد.                          |
| الدليل                         | الجذر.                                                                                                  |
| التصنيف                        | Documentation drift risk.                                                                                |
| الخطورة                        | Low                                                                                                     |
| الأثر                          | تحديث rule واحد يتطلب 3 ملفات → احتمالية drift عبر الزمن.                                                |
| السبب المحتمل                  | Rule XLVIII يدعم Claude/Gemini/Codex.                                                                   |
| الحل المقترح                   | اعتماد `AGENTS.md` كمصدر، والآخران يستوردان منه ضمن قالب توليد عبر سكربت `pnpm tempot context:render`.    |
| الأولوية                       | P3                                                                                                      |
| متوافق مع المنهجية؟            | نعم                                                                                                     |
| طريقة التنفيذ                  | spec في `037-module-tooling-foundation` follow-up أو spec جديد.                                          |
| معيار القبول                   | ملف واحد source-of-truth + سكربت توليد يفحصه CI.                                                         |

## I015 — Specs deferred packages — نسخة محدّثة من ROADMAP

| البند                          | التفاصيل                                                                                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| المشكلة                        | الدستور (Rule XC) يذكر deferred packages اعتبارًا من 2026-04-25 لكن README يقول "All packages formerly deferred ... are now active".          |
| الدليل                         | `README.md:24` vs `.specify/memory/constitution.md:652`.                                                                                    |
| التصنيف                        | Documentation drift.                                                                                                                        |
| الخطورة                        | Low                                                                                                                                         |
| الأثر                          | مساهم جديد قد يبني افتراضات خاطئة عن حالة الحزم.                                                                                            |
| السبب المحتمل                  | الدستور لم يُحدَّث بعد تفعيل آخر الحزم (Spec #008).                                                                                          |
| الحل المقترح                   | تحديث Rule XC في الدستور لإغلاق قسم deferred + نشر amendment 2.5.1.                                                                          |
| الأولوية                       | P2                                                                                                                                          |
| متوافق مع المنهجية؟            | نعم — Constitution Amendment Process (Rule LIII).                                                                                            |
| طريقة التنفيذ                  | proposal من Technical Advisor → Project Manager approval → تحديث `.specify/memory/constitution.md` مع MINOR/PATCH bump.                       |
| معيار القبول                   | الدستور يعكس deferred = none؛ README يطابق.                                                                                                  |

## ملخص حسب الأولوية

| الأولوية | المعرّفات                                                            |
| -------- | -------------------------------------------------------------------- |
| **P0**   | I004 (.env hygiene)، I011 (gitleaks)، I012 (Spec #057 finish).        |
| **P1**   | I001، I002، I003، I006، I007، I013.                                  |
| **P2**   | I005، I008، I010، I015.                                              |
| **P3**   | I009، I014.                                                          |

> جميع الحلول تمر عبر منهجية SpecKit + Superpowers. لا توجد توصية تستدعي إصلاحًا مباشرًا خارج المنهجية.
