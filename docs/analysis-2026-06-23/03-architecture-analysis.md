# 03 - تحليل المعمارية

## 1. النموذج المعماري

ينصّ Rule XIII على فصل ثلاثي صارم باتجاه أحادي للاعتمادية:

```
apps/       → packages/ → modules/
(interfaces)  (services)   (core/business logic)
```

> **ملاحظة:** التعريف في الدستور يضع `modules/` كـ Core، لكن الاعتماد الفعلي يجري من apps → packages → modules (interface تستهلك service تستهلك business logic). الترتيب الموثَّق في `eslint.config.js` بـ tiered classification يتعامل فقط مع `packages/` (4 tiers)، بينما `modules/` تُمنع من استيراد بعضها (Rule XV).

## 2. الطبقات الفعلية

| الطبقة            | المسار        | المسؤولية                                                                                          |
| ------------------ | ------------- | -------------------------------------------------------------------------------------------------- |
| Interfaces (Apps)  | `apps/`       | تُجمّع وتُشغّل الزمن التشغيلي (bot-server) أو تنشر التوثيق (docs Starlight).                          |
| Services (Packages)| `packages/`   | بنية تحتية مشتركة (DB, cache, queue, AI, i18n, auth, storage, ...).                                  |
| Business (Modules) | `modules/`    | منطق الأعمال (commands/handlers/services/repositories/menus + i18n locales).                       |

## 3. تصنيف الحزم (ADR-035)

`eslint.config.js` يطبق 4 طبقات داخل `packages/`:

| Tier            | الحزم                                                                  | يمكنه استدعاء                          |
| --------------- | ---------------------------------------------------------------------- | -------------------------------------- |
| 1 Foundation    | `shared`                                                               | لا شيء (`@tempot/*`)                   |
| 2 Infrastructure| `database`, `event-bus`, `logger`, `sentry`                            | Tier 1 + Tier 2                        |
| 3 Cross-cutting | `i18n-core`, `auth-core`, `interaction-observability`                  | Tier 1 + Tier 2                        |
| 4 Domain        | جميع البقية                                                            | Tier 1 + Tier 2 + Tier 3 (ليس Tier 4 آخر) |

يُفرَض هذا في زمن البناء عبر `boundaries/dependencies` rule مع `default: 'disallow'`.

## 4. عقود الـ Modules

- وجود `module.config.ts` و`module.manifest.ts` و`abilities.ts` لكل وحدة → عقد واضح للتسجيل.
- `runtime-manifest.ts` (`scripts/ci/`) يُولّد `runtime-manifest.json` في الـ Dockerfile قبل التشغيل ليتأكد من تطابق الـ modules المحمَّلة مع المُعلَن في الـ specs.
- `module-registry` package يدير دورة حياة التحميل.

## 5. الاعتمادية بين الأجزاء

| العلاقة                                            | الآلية                                                                                              |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| apps → packages                                    | استيراد عبر `@tempot/<package>` (workspace:*).                                                      |
| apps → modules                                     | عبر `module-loader.ts` ديناميكيًا، مع توثيق في `runtime-manifest.json`.                              |
| modules → packages                                 | الحزم تكون `peerDependencies` في كل module (مثال: `modules/user-management/package.json`).            |
| modules ↛ modules                                  | محظور سلوكيًا (Rule XV) ومُفرَض عبر `boundaries/ignore` للاختبارات وعبر `pnpm boundary:audit`.        |
| services → repositories → DB                       | Rule XIV: لا `prisma` مباشر داخل services.                                                          |

## 6. قابلية التوسع

| العامل                                                                           | التقييم                                                                                                 |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| إضافة حزمة جديدة                                                                  | عبر `pnpm tempot module create` + `package-creation-checklist.md` (10 نقاط) + spec كامل.                |
| إضافة وحدة جديدة                                                                  | عبر `new-module-checklist.md` (`docs/developer/new-module-checklist.md`).                              |
| توسيع لمزيد من تطبيقات (Dashboard / Mini App)                                     | البنية جاهزة (`apps/` مُعد بـ workspace) — Rule XIII تنص عليها.                                          |
| توسيع لـ SaaS (multi-bot)                                                         | `docs/architecture/saas-readiness.md` يوثّق الحدود الحالية و`bot-management` يخدم كـ "future SaaS bridge". |

## 7. قابلية الاختبار

| البند                                                                           | الحالة                                                                                                |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Dependency Injection                                                            | `deps.factory.ts` يبني deps حقيقي، `bot.factory.ts` يستخدمه. هذا يُسهّل التوكيل في الاختبارات.        |
| تباعد بين البنية والـ Domain                                                     | الـ repositories تأخذ Prisma client عبر deps → كل Service قابل للاختبار باستخدام mock.                  |
| Testcontainers                                                                  | متضمنة في devDependencies الحزم التي تحتاج DB حقيقي.                                                  |
| تطبيق Test Pyramid (70/20/10)                                                   | متطلب دستوري (Rule XXXV). الـ vitest projects تدعم unit/integration/e2e منفصلة.                       |

## 8. قابلية فصل المسؤوليات

- كل Tier له مسؤولية واضحة → فحص الاستيراد آلي.
- داخل كل module: `commands` للتوجيه، `handlers` للمعالجة، `services` للمنطق، `repositories` للبيانات، `menus` لـ UI، `events` للنشر، `locales` للتدويل.
- الأسرار خارج الكود (Rule VI، Rule XXXI، ملف `.env.example`).

## 9. ملاءمة المعمارية لحجم المشروع

- المشروع يحوي 22 حزمة + 9 modules + 58 specs → حجم متوسط/كبير. Tiered architecture مع SpecKit ضروري لإدارة هذا الحجم.
- الـ overhead المنهجي مبرَّر لأن المشروع يستهدف **enterprise-grade Telegram framework**، وليس prototype.
- لو كان الحجم أصغر بكثير، لكان هذا الانضباط overkill. هنا متناسب.

## 10. نقاط القوة

| البند                                                                                                   | الدليل                                                                  |
| ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Tiered package architecture يفرضه linter في زمن البناء، لا يُترك للاجتهاد.                                | `eslint.config.js` + ADR-035.                                          |
| Service abstraction واضحة (Rule XVIII): كل خدمة خارجية خلف interface مع ADR.                              | ADR-016, ADR-018, ADR-027, ADR-031, ADR-039.                          |
| Runtime manifest يربط الـ deployed runtime بالمواصفات.                                                    | `scripts/ci/runtime-manifest.ts` + `apps/bot-server/Dockerfile`.        |
| Health checks ثلاثية المستوى: liveness + readiness + بمستخدمين موثَّقين.                                  | `apps/bot-server/Dockerfile` healthcheck على `/live`.                  |

## 11. نقاط الضعف

| البند                                                                                                  | الخطورة | الدليل                                                                                                                |
| ------------------------------------------------------------------------------------------------------ | ------- | --------------------------------------------------------------------------------------------------------------------- |
| Tier classification يشمل `packages/` فقط؛ `modules/` تعتمد على Rule XV نصًّا دون فرض linter صريح.        | Medium  | `eslint.config.js` (boundaries لا تعالج `modules/`). يتمم ذلك `pnpm boundary:audit` (`scripts/ci/import-boundary-audit.ts`). |
| Cross-cutting `interaction-observability` ضعيف الاختبار (1 ملف اختبار فقط).                            | Medium  | فحص الـ inventory أعلاه.                                                                                              |
| تطبيق Rule XIV لا يُفحَص آليًا في كل service؛ لو احتاج service مستقبلي Prisma لاختبار، فقد يخالف.        | Medium  | يفحص جزئيًا بـ `import-boundary-prisma-audit.ts`.                                                                     |
| `bot-server/src/bot-server.types.ts` يبلغ 201 سطر — حد الإطلاق دلاليًا.                                  | Low     | المراجعة الإنسانية مستحبة لتقسيم types الكبيرة.                                                                       |

## 12. خلاصة

المعمارية **ناضجة ومناسبة جدًا لحجم المشروع**. أبرز مهمة تطويرية مستقبلية تبقى:

1. تثبيت boundaries enforcement على `modules/` كلسانًا أوّلًا.
2. سدّ فجوة الاختبارات في `interaction-observability` لأنه Tier 3 (Cross-cutting) ويُستهلك من معظم الـ Domain.
3. توثيق رحلة الـ SaaS كـ ADR لاحق (موجود بـ `saas-readiness.md` لكن دون ADR رسمي حتى الآن).
