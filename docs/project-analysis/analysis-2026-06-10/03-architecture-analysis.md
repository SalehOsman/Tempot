# 03 - تحليل المعمارية

## الصورة الكلية

Tempot معمارية ثلاثية الطبقات معززة بـ ADRs (44 ADR في
`docs/architecture/adr/`) وحدود استيراد رباعية مفروضة على مستوى ESLint.

```
apps/bot-server  ─┐
apps/docs        ─┤  (واجهات)
                  │
packages/         │  (بنية تحتية: 23 حزمة)
  shared          │  Tier 1 Foundation
  database        │  Tier 2 Infrastructure
  event-bus       │
  logger          │
  sentry          │
  i18n-core       │  Tier 3 Cross-cutting
  auth-core       │
  interaction-observability
  …               │  Tier 4 Domain (ai-core, notifier, storage-engine, …)
                  │
modules/          │  (8 وحدات عمل، Tier 4 — لا تستورد بعضها بعضًا)
  user-management
  template-management
  settings-management
  notification-center
  content-management
  audit-viewer
  help-center
  bot-management
```

## المكونات والاعتمادية

### قاعدة الاتصال بين الوحدات

- **Event Bus فقط بين الوحدات**: لا `import` مباشر بين الوحدات
  (مفروض بقاعدة `boundaries/dependencies`).
- **Repositories فقط للوصول إلى Prisma**: الخدمات والـ handlers
  ممنوعة من Prisma مباشرة (دستور).
- **i18n مفروض**: لا نصوص نهائية في `.ts`، الحلول من ملفات
  `locales/{ar,en}/`.

### نمط Bot Server

`apps/bot-server/src/index.ts` يطبق نمط Composition Root نظيف:

1. `runDockerDiagnostics()` تشخيص بيئة قبل أي بناء.
2. `buildDeps()` تبني كل الاعتماديات وتُرجع `Result<Deps, AppError>`.
3. `startApplication(deps)` تتولى التشغيل الفعلي وتُرجع `Result`.

هذا فصل تركيبي ممتاز: لا منطق عمل في entry point، اختبار سهل عبر
حقن `deps`.

### حزم Tier-aware

- **Foundation (`shared`)**: لا يستورد أي حزمة Tempot.
- **Infrastructure (`database`, `event-bus`, `logger`, `sentry`)**:
  مسموح فقط بنفس الطبقة + Foundation.
- **Cross-cutting (`i18n-core`, `auth-core`, `interaction-observability`)**:
  مسموح بـ Tier 1 + Tier 2.
- **Domain (الباقي)**: مسموح بكل الطبقات الأدنى لكن لا بين أقران Tier 4.

## قابلية التوسع

- **SaaS-readiness** موثقة في
  `docs/architecture/saas-readiness.md` و `saas-migration-map.md`.
  الموقف الرسمي (ROADMAP) أن النواة الحالية single-bot template،
  لكن متغيرات الحالة وآثار الـ Audit مهيأة لمسار multi-bot/SaaS لاحقًا.
- **Pluggable**: علامات `TEMPOT_*` في `.env.example` تتحكم بتفعيل
  الحزم وقت التشغيل (input, dynamic CMS, search, documents, import,
  mini apps, payment...). أسلوب feature-flag على مستوى الحزمة
  معماريًا قوي ولكنه يحتاج اختبارًا منهجيًا لكل تركيبة على حدة (غير
  مذكور في الاختبارات الحالية).

## قابلية الاختبار

- بنية الـ Composition Root + Result + Repositories تجعل اختبار
  الوحدات وحقن الاعتماديات سهلًا.
- 8 وحدات تحتوي مجلد `tests/` مع تنظيم unit/integration.
- إعداد `vitest` متعدد المشاريع: `--project=unit` و `--project=integration`.
- **ثغرة معمارية في الاختبار**: مشاريع Vitest الجذرية لا تشمل
  `apps/*` (موثق في تدقيق 2026-06-07). نتيجة: شريحة كبيرة من سطح
  التشغيل لا تختبر في CI الموحد. هذه فجوة معمارية في "حدود
  بوابة الجودة" أكثر منها فجوة بنائية في الكود.

## فصل المسؤوليات

| الطبقة | المسؤولية الحصرية |
|--------|--------------------|
| `apps/` | تركيب وتشغيل (Telegram polling/webhook، Hono HTTP، docs site) |
| `packages/` | قدرات أفقية قابلة لإعادة الاستخدام |
| `modules/` | حالات استخدام تجارية، تستهلك القدرات الأفقية فقط |
| `specs/` | عقد المتطلبات التنفيذي قبل أي تطبيق |
| `docs/` | شرح للبشر |
| `.specify/memory/` | الدستور وأطر الأدوار (Authority highest) |

التفصيل احترافي ولا يوجد تسرب واضح بين الطبقات في عينات القراءة.

## ملاءمة المعمارية لحجم المشروع

| البعد | التقييم |
|-------|---------|
| تعقيد المعمارية مقابل عدد الميزات | مناسب — التعقيد متناسب مع 23 حزمة + 8 وحدات + RAG + مراقبة |
| التكلفة الإدراكية للمطور الجديد | متوسطة-مرتفعة لكن مدعومة بـ ONBOARDING.md و workflow-guide |
| القابلية للتطوير المرحلي | عالية بفضل Pluggable + Tiers + Specs |
| مخاطر الـ Over-engineering | منخفضة — كل قطعة مبررة بـ ADR موثق |

## التقييم

- **سلامة طبقات المعمارية**: 92%
- **حوكمة الاعتمادية**: 95%
- **قابلية التوسع**: 80% (محدودة فقط بنضج الـ remediation program)
- **قابلية الاختبار**: 78% (تخفيف بسبب استبعاد apps من CI الجذر)
- **فصل المسؤوليات**: 90%
- **ملاءمة الحجم**: 88%

## التوصية المنهجية

أي تعديل معماري كبير (مثل إضافة Tier جديد أو تغيير قاعدة استيراد)
يتم عبر ADR جديد في `docs/architecture/adr/` ثم Spec في `specs/`،
ثم Superpowers execution وفق `docs/developer/workflow-guide.md`.
لا تعديلات معمارية أحادية الجانب على `eslint.config.js`.
