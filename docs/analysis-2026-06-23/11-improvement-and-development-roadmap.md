# 11 - مقترحات التطوير وخارطة الطريق

> كل مقترح يلتزم بمنهجية SpecKit + Superpowers و90 قاعدة دستورية. أي مقترح يستلزم تعديلًا للمنهجية يمر عبر Rule LIII (Amendment Process). لا توصية خارج هذا الإطار.

## 1. تحسينات بنية المشروع

### 1.1 توحيد نمط `peerDependencies` للوحدات

- **الوصف:** توثيق صريح في `docs/developer/` ولوحدات template على متى يستخدم module ‎`peerDependencies` مقابل `dependencies`.
- **السبب:** عدة وحدات (مثل `user-management/package.json`) تتبع نمط `peerDependencies` ممتاز، لكنه غير موثَّق رسميًا → خطر drift عند إضافة وحدة جديدة.
- **القيمة التقنية:** يقلل تكرار نسخ الحزم في node_modules؛ يحافظ على source-of-truth للإصدارات في الجذر.
- **الأولوية:** P2.
- **التعقيد:** منخفض (وثائق + template update).
- **طريقة التنفيذ:** spec docs-only ضمن `037-module-tooling-foundation` follow-up.
- **معايير القبول:** `docs/developer/module-package-dependency-policy.md` موجود؛ `pnpm tempot module create` ينشئ `peerDependencies` صحيحة.

### 1.2 توحيد سكربت `pnpm verify`

- **الوصف:** إضافة سكربت موحَّد على الجذر يجمع `lint + typecheck + boundary:audit + test:unit + spec:validate`.
- **السبب:** المطورون يستخدمون مجموعات سكربتات مختلفة قبل الـ push. اختصار واحد يقلل احتمال فقدان gate ما.
- **القيمة:** زمن feedback أسرع، PRs أقل فشلًا.
- **الأولوية:** P1.
- **التعقيد:** منخفض جدًا.
- **طريقة التنفيذ:** spec docs-and-tooling قصير؛ commit `chore(scripts): add pnpm verify`.
- **معايير القبول:** `pnpm verify` يطبع نجاح أو فشل واضحًا في < 2 دقيقة.

## 2. تحسينات نمط الكود

### 2.1 تطبيق Tier classification على `modules/`

- **الوصف:** توسيع `eslint-plugin-boundaries` في `eslint.config.js` ليشمل الـ modules مع تصنيف "domain" واحد + قاعدة "module ↛ module".
- **السبب:** حاليًا، Rule XV يُفرض عبر `pnpm boundary:audit` (سكربت مستقل)؛ توسيع ESLint يجعل الفرض جزءًا من الـ pre-commit مباشرة.
- **القيمة:** Feedback آني أثناء كتابة الكود.
- **الأولوية:** P2.
- **التعقيد:** متوسط (يتطلب تجريب على pattern صحيح + استثناءات للاختبارات).
- **طريقة التنفيذ:** spec جديد `064-modules-boundary-eslint` ضمن SpecKit. ADR قصير يربطها بـ ADR-035.
- **معايير القبول:** `pnpm lint` يفشل عند `import '@tempot/<another-module>'`؛ `pnpm boundary:audit` يبقى كـ defense-in-depth.

### 2.2 توحيد نمط استيراد الـ workspace packages

- **الوصف:** كل الحزم تستخدم `@tempot/<name>` (مطبق فعليًا). الإصدار التوكيدي: regex check في `source-conformance-audit.ts` يمنع import relative بين الحزم.
- **السبب:** يضمن عدم اختراق الـ boundary عبر relative imports.
- **القيمة:** تطبيق هيكلي أعمق.
- **الأولوية:** P2.
- **التعقيد:** منخفض.
- **طريقة التنفيذ:** تعديل `source-conformance-audit.ts` + tests + commit.
- **معايير القبول:** `pnpm source:conformance` يفشل على relative import عبر packages.

## 3. تحسينات TypeScript strictness

### 3.1 تفعيل `noUncheckedIndexedAccess`

- **الوصف:** إضافة `noUncheckedIndexedAccess: true` إلى `tsconfig.json` الجذر.
- **السبب:** يمنع `arr[i]` من أن يُعتبر `T` بدلًا من `T | undefined`؛ يمسك bugs محتملة.
- **القيمة:** أمان نوع أعلى.
- **الأولوية:** P2.
- **التعقيد:** متوسط (قد يتطلب تعديلات في الكود).
- **طريقة التنفيذ:** spec جديد `065-typescript-strictness-uplift`؛ TDD على كل تعديل صغير.
- **معايير القبول:** `pnpm build` يمر مع الـ flag مفعّلة؛ لا تراجع في tests.

### 3.2 تفعيل `exactOptionalPropertyTypes`

- **الوصف:** إضافة `exactOptionalPropertyTypes: true`.
- **السبب:** يمنع تمرير `undefined` لخصائص اختيارية بشكل ضمني.
- **القيمة:** نمط نوع أنظف.
- **الأولوية:** P3.
- **التعقيد:** متوسط/مرتفع.
- **طريقة التنفيذ:** نفس spec أعلاه.
- **معايير القبول:** نفس الأعلى.

## 4. تحسينات Docker

### 4.1 إضافة `HEALTHCHECK` داخل Dockerfile

- **الوصف:** نقل/تكرار الـ healthcheck من docker-compose إلى Dockerfile مباشرة.
- **السبب:** يجعل الـ image قابلًا للنشر على orchestrators أخرى (Kubernetes, ECS) بدون configuration إضافي.
- **القيمة:** portability أعلى.
- **الأولوية:** P2.
- **التعقيد:** منخفض.
- **طريقة التنفيذ:** ضمن `057` follow-up أو spec جديد قصير.
- **معايير القبول:** `docker inspect` على الـ image يظهر HEALTHCHECK مضمَّن.

### 4.2 BuildKit secrets للأسرار البنائية

- **الوصف:** نقل أي build-time secrets (إن وُجدت) إلى `--mount=type=secret`.
- **السبب:** يمنع secrets أن تنزرع في image layers.
- **القيمة:** أمان supply chain إضافي.
- **الأولوية:** P3.
- **التعقيد:** منخفض.
- **طريقة التنفيذ:** ضمن security spec.
- **معايير القبول:** لا secrets في `docker history`.

### 4.3 SBOM verification في deploy

- **الوصف:** إضافة سكربت deploy يتحقق من Cosign verify قبل تشغيل image في staging/production.
- **السبب:** اليوم التحقق يتم وقت البناء فقط (Rule XXV chain امتدادي).
- **القيمة:** Zero-trust فعلي.
- **الأولوية:** P1 (إن دخل النشر السحابي).
- **التعقيد:** متوسط.
- **طريقة التنفيذ:** ضمن `057` follow-up.
- **معايير القبول:** سكربت deploy موثَّق يفشل على image غير موقعة.

## 5. تحسينات CI/CD

### 5.1 Codecov / Coveralls integration

- **الوصف:** رفع coverage report إلى أداة خارجية وإضافة badge في README.
- **السبب:** يجعل تتبع التغطية مرئيًا تاريخيًا للمساهمين.
- **القيمة:** شفافية + جذب مساهمين.
- **الأولوية:** P2.
- **التعقيد:** منخفض.
- **طريقة التنفيذ:** spec docs-and-tooling.
- **معايير القبول:** badge في README يعكس آخر coverage على main.

### 5.2 OSV scanner كمكمل لـ pnpm audit

- **الوصف:** إضافة `osv-scanner` job في CI.
- **السبب:** يغطي مصادر CVE أوسع من npm advisory database.
- **القيمة:** تعزيز bowing supply chain.
- **الأولوية:** P2.
- **التعقيد:** منخفض.
- **طريقة التنفيذ:** ضمن security spec.
- **معايير القبول:** job موجود وغير معطّل، يمر على HEAD حاليًا.

### 5.3 Renovate / Dependabot configuration

- **الوصف:** ملف `.github/dependabot.yml` أو `renovate.json` لمراقبة التحديثات الأمنية والمعتدلة.
- **السبب:** يقلل تأخر الترقيع.
- **القيمة:** نشاطات أمنية أوتوماتيكية.
- **الأولوية:** P1.
- **التعقيد:** منخفض.
- **طريقة التنفيذ:** ضمن security spec.
- **معايير القبول:** PRs أوتوماتيكية تظهر للتحديثات الأمنية الجديدة.

### 5.4 Matrix typecheck لـ Bun runtime (مستقبلي)

- **الوصف:** اختيارًا، إضافة Bun إلى matrix typecheck للتأكد من توافق الكود مع runtimes بديلة.
- **السبب:** Bun يصبح option مهمة، يقي من lock-in.
- **القيمة:** future-proof.
- **الأولوية:** P3.
- **التعقيد:** متوسط (قد تنكسر بعض tests على Bun).
- **طريقة التنفيذ:** spec بحثي أولًا.
- **معايير القبول:** قرار ADR صريح Yes/No.

## 6. تحسينات الاختبارات

### 6.1 Component-level coverage thresholds

- **الوصف:** تحديث `coverage-policy.ts` ليفحص thresholds per-component (services, handlers, repositories, conversations) كما تنص Rule XXXVI.
- **السبب:** اليوم thresholds مذكورة في الدستور لكن قد لا تكون مفصلة في الـ policy script.
- **القيمة:** تطبيق دستوري أعمق.
- **الأولوية:** P1.
- **التعقيد:** متوسط (يحتاج كلاسيفيكاتور للملفات).
- **طريقة التنفيذ:** ضمن `059-test-coverage-uplift` أو spec فرعي.
- **معايير القبول:** failure message يوضح أي component فشل وأين.

### 6.2 Contract tests بين الـ modules والـ event-bus

- **الوصف:** إضافة contract tests تستخدم schemas الـ event types في `@tempot/event-bus`.
- **السبب:** ADR-036 يوصف typed publish contracts، لكن لا توجد contract tests الآن.
- **القيمة:** منع كسر contracts غير مرئي.
- **الأولوية:** P1.
- **التعقيد:** متوسط.
- **طريقة التنفيذ:** spec جديد `066-event-bus-contract-tests`.
- **معايير القبول:** test يفشل على publish بـ payload يخالف الـ schema.

### 6.3 Mutation testing PoC

- **الوصف:** تجربة Stryker على حزمة واحدة (مثل `shared`) لقياس kill score.
- **السبب:** يقيس **جودة** الـ tests، لا فقط وجودها.
- **القيمة:** كشف false positives في coverage.
- **الأولوية:** P3.
- **التعقيد:** عالٍ.
- **طريقة التنفيذ:** spec بحثي.
- **معايير القبول:** قرار ADR مدعوم بـ PoC.

## 7. تحسينات التوثيق

### 7.1 Methodology Quick Reference

- **الوصف:** صفحة `docs/developer/methodology-quick-reference.md` تلخص rules الـ 90 + الأدوار + الـ workflow في صفحتين.
- **السبب:** قراءة الدستور كاملًا تأخذ ساعة. الـ quick reference يقلل onboarding time.
- **القيمة:** تجذب مساهمين خارجيين.
- **الأولوية:** P1.
- **التعقيد:** منخفض.
- **طريقة التنفيذ:** spec docs-only.
- **معايير القبول:** الصفحة موجودة + مرتبطة من README و CONTRIBUTING.

### 7.2 SaaS-readiness ADR رسمي

- **الوصف:** ترقية `docs/architecture/saas-readiness.md` إلى ADR-046 رسمي.
- **السبب:** نقاش معماري مهم بدون ADR يخالف Rule XLIV.
- **القيمة:** توثيق دائم.
- **الأولوية:** P2.
- **التعقيد:** منخفض.
- **طريقة التنفيذ:** spec docs-only؛ ADR Timing (Rule LXIII): قبل أي تنفيذ يتأثر.
- **معايير القبول:** ADR موجود + مفهرس في `docs/architecture/adr/README.md`.

### 7.3 Operations runbooks

- **الوصف:** سلسلة runbooks تحت `docs/operations/`: deploy, rollback, secrets rotation, backup/restore, incident response.
- **السبب:** Rule XXIV ERR-YYYYMMDD-XXXX يحتاج عملية مراجعة موثقة.
- **القيمة:** قابلية تشغيل أعلى عند الحوادث.
- **الأولوية:** P1.
- **التعقيد:** متوسط.
- **طريقة التنفيذ:** spec docs-only كبير `067-operations-runbooks-set`.
- **معايير القبول:** runbooks موجودة ومعتمدة من Project Manager.

## 8. تحسينات الأمان

### 8.1 Admission control عند الـ deploy

- **الوصف:** ضمان أن أي pull image للنشر يتحقق من Cosign signature.
- **السبب:** اليوم التحقق وقت البناء فقط.
- **القيمة:** Zero-trust على chain النشر.
- **الأولوية:** P1.
- **التعقيد:** متوسط/مرتفع.
- **طريقة التنفيذ:** ضمن `057` follow-up أو spec deploy جديد.
- **معايير القبول:** سكربت deploy يفشل على image غير موقعة.

### 8.2 Secrets manager integration

- **الوصف:** دراسة استخدام Doppler/HashiCorp Vault/1Password CLI بدل `.env` ملف نصي.
- **السبب:** يقلل احتمال تسرب الـ token من القرص.
- **القيمة:** secrets hygiene أعلى.
- **الأولوية:** P2.
- **التعقيد:** متوسط.
- **طريقة التنفيذ:** spec بحثي ثم تنفيذي.
- **معايير القبول:** قرار ADR + dev experience documented.

### 8.3 Telegram update validation tightening

- **الوصف:** فحص أن جميع webhook updates ممرّة عبر Zod validation صارمة (مفعّل جزئيًا بحسب ROADMAP 2026-06-18).
- **السبب:** Rule XXV chain validation.
- **القيمة:** منع DoS عبر updates مشوهة.
- **الأولوية:** P1 (مرتبط بـ Spec #057 الجاري).
- **التعقيد:** منخفض/متوسط.
- **طريقة التنفيذ:** متابعة Spec #057.

## 9. تحسينات تجربة المطور

### 9.1 `pnpm tempot doctor --verbose`

- **الوصف:** توسيع doctor ليطبع جميع gates ومتطلبات env + ROADMAP status.
- **السبب:** يقلل احتكاك تشخيص المشاكل المحلية.
- **القيمة:** debug أسرع.
- **الأولوية:** P2.
- **التعقيد:** منخفض.
- **طريقة التنفيذ:** ضمن `037` follow-up.
- **معايير القبول:** الأمر يطبع تقرير شامل في < 30 ثانية.

### 9.2 `setup-dev.ps1` للـ Windows

- **الوصف:** نسخة PowerShell لـ `setup-dev.sh`.
- **السبب:** المشروع متطور على Windows (`F:\` drive)؛ لا يجب الاعتماد على bash فقط.
- **القيمة:** onboarding متعدد المنصات.
- **الأولوية:** P2.
- **التعقيد:** منخفض.
- **طريقة التنفيذ:** docs-and-tooling spec.
- **معايير القبول:** يعمل على Windows 11 / PowerShell 7.

### 9.3 VS Code workspace recommendations

- **الوصف:** ملف `.vscode/extensions.json` يوصي بـ ESLint, Prettier, TS Language Features, Vitest, etc.
- **السبب:** يضمن انسجام بيئة المطور.
- **القيمة:** onboarding أسلس.
- **الأولوية:** P3.
- **التعقيد:** منخفض جدًا.
- **طريقة التنفيذ:** docs-only.
- **معايير القبول:** التوصيات تعمل مع الإعدادات الحالية.

## 10. تحسينات إدارة الإصدارات

### 10.1 Changeset templates لأنواع الإصدار

- **الوصف:** قوالب changeset (`feat/fix/security/docs/refactor`) داخل `.changeset/templates/`.
- **السبب:** يقلل التشتت في كتابة CHANGELOG.
- **القيمة:** اتساق + سرعة.
- **الأولوية:** P3.
- **التعقيد:** منخفض.
- **طريقة التنفيذ:** docs-and-tooling spec.

### 10.2 Pre-release branches (`alpha`, `beta`)

- **الوصف:** دراسة استخدام pre-release tags لـ `v1.0` قبل GA.
- **السبب:** يسمح بـ feedback من early adopters.
- **القيمة:** stability قبل النشر الكامل.
- **الأولوية:** P2.
- **التعقيد:** متوسط.
- **طريقة التنفيذ:** spec بحثي.
- **معايير القبول:** قرار ADR + سياسة تحديد ما يدخل alpha vs beta vs RC.

## 11. تحسينات منهجية العمل

### 11.1 ADR للـ Three-Role Framework

- **الوصف:** ADR رسمي يربط `roles.md` بالـ ADR-040 (Tempot Core / Cloud boundary).
- **السبب:** المنهجية الإدارية يجب أن تُعامَل كقرار معماري أيضًا.
- **القيمة:** ربط الحوكمة بالبنية.
- **الأولوية:** P3.
- **التعقيد:** منخفض.
- **طريقة التنفيذ:** docs-only + Rule XLIV.

### 11.2 Spec lint CLI

- **الوصف:** `pnpm tempot spec lint` يفحص: لا `[NEEDS CLARIFICATION]`، plan/tasks/data-model موجودة، roadmap status موجود.
- **السبب:** بوابة pre-handoff قابلة للتنفيذ محليًا.
- **القيمة:** اكتشاف فجوات قبل CI.
- **الأولوية:** P2.
- **التعقيد:** متوسط.
- **طريقة التنفيذ:** spec في `037` follow-up.
- **معايير القبول:** الأمر يطبق نفس rules كـ `pnpm spec:validate` لكنه أسرع.

### 11.3 Verification checklists لكل دور

- **الوصف:** قائمة مراجعة سريعة لكل من PM/Advisor/Executor في `.specify/templates/`.
- **السبب:** يحوّل الأدوار من نص دستوري إلى عملية يومية.
- **القيمة:** التزام أعلى بـ roles.md.
- **الأولوية:** P3.
- **التعقيد:** منخفض.
- **طريقة التنفيذ:** docs-only.

## 12. خارطة الطريق المُقترحة (Roadmap visualization)

```
2026-Q3                          2026-Q4                          2027-Q1
=======                          =======                          =======
[1.1] Spec #057 finish           [3.x] Docker hardening (HC, BuildKit)  [6.3] Mutation testing PoC
[2.1] Spec #058 finish           [3.x] Doc unify (P2 docs)              [5.4] Bun matrix exploration
[1.2-1.3] gitleaks + rotation    [5.1] Codecov                          [8.2] Secrets manager
[2.2] Clean workspace debt       [5.2] OSV scanner                      [11.x] Methodology DX uplift
[2.3] Coverage local             [5.3] Renovate
[2.4] interaction-obs coverage   [6.1] Component thresholds
                                 [6.2] Event-bus contract tests
                                 [7.1] Quick reference
                                 [7.2] SaaS-readiness ADR
                                 [7.3] Runbooks
                                 [8.1] Admission control
                                 [9.x] DX uplift
v1.0 GA candidate                                              Tempot Cloud activation considered
```

## خلاصة

- خارطة الطريق المقترحة **incremental** بالكامل، لا revolutionary.
- كل تحسين يرتبط بـ rule دستوري أو ADR أو spec.
- التركيز الأول على إغلاق ديون النشر؛ الثاني على تعزيز التغطية الحرجة؛ الثالث على رفع تجربة المطور.
- لا توجد توصية تطلب كسر منهجية SpecKit + Superpowers أو تعديل قاعدة دستورية دون Amendment Process.
