# 02 - تحليل جودة الكود

## 1. الإطار المرجعي

`eslint.config.js` يُفعّل بشكل صريح القواعد الدستورية التالية:

| القاعدة                                       | التطبيق العملي                                                                                        |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `@typescript-eslint/no-explicit-any: error`   | يطابق Rule I.                                                                                         |
| `@typescript-eslint/ban-ts-comment: error`    | يطابق Rule I.                                                                                         |
| `max-lines: 200`                              | يطابق Rule II مع `skipBlankLines` و`skipComments`.                                                    |
| `max-lines-per-function: 50`                  | يطابق Rule II.                                                                                        |
| `max-params: 3`                               | يطابق Rule II.                                                                                        |
| `no-console: error`                           | يطابق Rule LXXIV.                                                                                     |
| `no-empty: { allowEmptyCatch: false }`        | يطابق Rule X.                                                                                         |
| `check-file/filename-blocklist`               | يطابق Rule III (يمنع `utils.ts` و`helpers.ts` و`misc.ts` و`common.ts`).                                |
| `boundaries/dependencies`                     | يطابق ADR-035 (Tier classification).                                                                  |

`prettier` مضبوط، وHusky يُلزم `lint-staged` على `pre-commit` ويفرض `commitlint` على `commit-msg`.

## 2. مؤشرات قابلة للقياس (مأخوذة فعليًا من المستودع)

| المؤشر                                                                                                      | القيمة                                                                                  |
| ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| عدد ملفات `.ts` المصدرية داخل `packages/*/src`                                                              | **327** ملفًا                                                                            |
| عدد ملفات `.ts` المصدرية داخل `modules/*` (باستثناء tests/dist)                                              | **211** ملفًا                                                                            |
| عدد ملفات `.ts` المصدرية داخل `apps/*/src`                                                                  | **50** ملفًا                                                                             |
| عدد ملفات `.test.ts` تحت `packages/`                                                                        | **231** ملفًا                                                                            |
| عدد ملفات `.test.ts` تحت `modules/`                                                                         | **80** ملفًا                                                                             |
| عدد ملفات `.test.ts` تحت `apps/`                                                                            | **46** ملفًا                                                                             |
| نسبة الاختبار/المصدر تقريبًا                                                                                | 357 / 588 ≈ **0.61** ملف اختبار لكل ملف مصدر                                            |
| استخدام `: any` صريح في ملفات الإنتاج                                                                       | **صفر** (لم يُرصد)                                                                       |
| استخدام `console.*` في الإنتاج                                                                              | **صفر** (لم يُرصد)                                                                       |
| استخدام `@ts-ignore` / `@ts-expect-error`                                                                   | **صفر** في `src/`                                                                       |
| استخدام `eslint-disable` خارج اختبارات                                                                      | **سطران** في `apps/bot-server/scripts/webhook-manager.ts`                                |
| تعليقات `TODO/FIXME/HACK`                                                                                    | حالة واحدة فقط في fixture اختباري (`apps/bot-server/tests/unit/middleware/sanitizer.middleware.test.ts:81`). |

## 3. الأنماط البرمجية

| النمط                                  | الحالة                                                                                                                      |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Result Pattern عبر `neverthrow 8.2.0`  | مطبق في الـ entry point (`apps/bot-server/src/index.ts`) وعبر الحزم. Rule XXI مطبقة.                                       |
| Repository Pattern                     | كل وحدة تملك `repositories/` (مثال: `modules/user-management/repositories/user.repository.ts`). Rule XIV مطبقة.            |
| Event-driven communication             | الوحدات لا تستورد بعضها (تم التحقق سريعًا)؛ التواصل عبر event-bus.                                                          |
| Pluggable architecture                 | متغيرات `TEMPOT_*` في `.env.example` تُفعّل/تُعطّل الحزم والوحدات. Rule XVI مطبقة.                                          |
| Graceful Shutdown                      | `packages/shared/src/shutdown/shutdown.manager.ts` موجود — تطبيق Rule XVII.                                                  |
| Naming convention                      | `{Feature}.{type}.ts` (مثل `bot.factory.ts`, `user.repository.ts`) — مطبق باستمرار.                                          |

## 4. التكرار وقابلية القراءة

- استخدام `index.ts` على مستوى الحزم لإعادة التصدير المُحكم (مثال: `packages/shared/src/index.ts` يصدر بدقة 9 أبواب رئيسية).
- لا يوجد ملف "god module": أكبر الملفات لا يتجاوز 245 سطرًا خامًا (`packages/input-engine/src/runner/confirmation.handler.ts`).
- مجلدات `commands/`, `handlers/`, `services/`, `repositories/` متوازية بين الـ modules → يقلل العبء المعرفي على المطور الجديد.
- استخدام `module.config.ts` و`module.manifest.ts` و`abilities.ts` كنقاط دخول قياسية لكل وحدة → نمط محكم وموحَّد.

## 5. الملفات التي تتجاوز 200 سطرًا خامًا

> ESLint يفحص بـ `skipBlankLines: true, skipComments: true`، لذا قد لا تكون أيٌّ من هذه انتهاكًا فعليًا، لكنها مرشحات للمراجعة:

| الملف                                                                            | الأسطر الخام |
| -------------------------------------------------------------------------------- | ------------ |
| `packages/input-engine/src/runner/confirmation.handler.ts`                       | 245          |
| `packages/input-engine/src/fields/smart/ai-extractor.field.ts`                   | 234          |
| `modules/user-management/repositories/user.repository.ts`                        | 228          |
| `packages/input-engine/src/runner/form.runner.ts`                                | 223          |
| `packages/database/src/prisma/prisma.client.ts`                                  | 214          |
| `apps/bot-server/src/bot/middleware/interaction-response.observer.ts`            | 213          |
| `apps/bot-server/src/startup/deps.orchestrator.ts`                               | 210          |
| `apps/bot-server/src/startup/module-loader.ts`                                   | 210          |
| `modules/bot-management/handlers/callback.handler.ts`                            | 208          |
| `modules/notification-center/handlers/callback.handler.ts`                       | 207          |
| `packages/storage-engine/src/storage.service.ts`                                 | 206          |
| `apps/bot-server/src/bot-server.types.ts`                                        | 201          |

> توصية: تنفيذ `pnpm lint` يكفي للتأكد من ESLint pass. إن مرّت جميعها، تبقى المراجعة استشارية فقط (هل توجد دالة داخلية فوق 50 سطرًا؟ هل يمكن تقسيم وحدة عرض إلى submodules لتسهيل الاختبار؟).

## 6. إدارة الأخطاء

- `packages/shared/src/shared.errors.ts` + `shared.result.ts` يقدمان `AppError` و`Result` المركزيين.
- `error-reference.generator.ts` يولّد `ERR-YYYYMMDD-XXXX` (Rule XXIV).
- entry point ينتقل من `Result.isErr()` إلى `process.exit(1)` مع log منظَّم (`apps/bot-server/src/index.ts:24..32`). نمط محترم.

## 7. استخدام الأنواع TypeScript

- `tsconfig.json` الجذر: `strict: true`, `module/moduleResolution: NodeNext`, `noEmit: true` (التصدير من tsconfig لكل حزمة).
- لا `any` صريح؛ ولا تجاوز عبر `@ts-ignore`.
- كل حزمة تملك `tsconfig.json` خاص بها (Rule LXXII) مع `outDir: dist`.
- `interaction-observability` (Tier 3) تظهر بـ test file واحد فقط بينما تصنّف Cross-cutting — تحتاج تعزيز تغطية.

## 8. جودة التصميم الداخلي

| البند                                                  | الحالة                                                                                                              |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| تجريد الخدمات الخارجية خلف Interface (Rule XVIII)      | مطبق (ADR-016 AI SDK، ADR-018 Storage merge، ADR-031 SDK advanced features، ADR-039 native RAG).                  |
| الكاش عبر `cache-manager` فقط (Rule XIX)               | متحقق بحكم الـ ADR-011/023 وعدم وجود تطبيقات كاش بديلة.                                                              |
| الطوابير عبر Queue Factory فقط (Rule XX)                | متحقق بحكم Rule LXXVII (no phantom deps) + غياب BullMQ في src مباشرة.                                                 |
| `runtime-manifest` لمنع تحميل modules غير معتمدة         | `scripts/ci/runtime-manifest.ts` يُولّد البيان قبل النشر.                                                            |

## 9. الانتهاكات المؤكدة

| رقم | المشكلة                                                                                                                   | الدليل                                                                                | الخطورة |
| --- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------- |
| C1  | استخدام `/* eslint-disable no-console */` و`/* eslint-disable max-lines-per-function */` في سكربت تشغيلي.                  | `apps/bot-server/scripts/webhook-manager.ts:1-2`                                     | Medium  |
| C2  | تعليقات بالعربية في ملفات إنتاجية تخالف Rule XL.                                                                            | `modules/user-management/abilities.ts:1-10` (وملفات أخرى مماثلة عند الفحص الموسَّع). | Medium  |
| C3  | بقايا artifact JavaScript في `src/` (`apps/bot-server/src/bot-server.types.js` بمحتوى `export {};`).                       | الملف موجود لكن خارج git (مستبعد بـ `.gitignore`).                                   | Medium  |
| C4  | مجلدات `utils/` فارغة (مثال: `modules/user-management/utils/`).                                                            | scaffolding غير محذوف.                                                              | Low     |

## 10. خلاصة

جودة الكود على المستوى الصارم (No `any`, No console, No bypass) **مرتفعة جدًا**: لا توجد انتهاكات Critical للقواعد المُؤتمتة. الانتهاكات الموجودة محدودة العدد وقابلة للإصلاح خلال branch واحد ضيّق (`codex/cleanup-dec-debt`) يتبع SpecKit مختصرًا (لأنها تغييرات documentation/scripts لا تمسّ سلوكًا).
