# 02 - تحليل جودة الكود

## القواعد المطبقة آليًا

`eslint.config.js` يطبق فعليًا قواعد الدستور التالية:

| القاعدة | التطبيق |
|---------|---------|
| Rule I: لا `any` | `@typescript-eslint/no-explicit-any: error` |
| Rule I: لا `@ts-ignore`/`@ts-expect-error` | `@typescript-eslint/ban-ts-comment: error` |
| Rule II: حدود الحجم | `max-lines: 200`, `max-lines-per-function: 50`, `max-params: 3` |
| Rule III: أسماء ملفات ممنوعة | `*utils*`, `*helpers*`, `*misc*`, `*common*` ممنوعة |
| Rule VIII: لا تعليقات TODO/FIXME/HACK في البداية | تحذير |
| Rule X: لا `catch` فارغة | `no-empty: error` (مع `allowEmptyCatch: false`) |
| Rule LXXIV: لا `console.*` في الإنتاج | `no-console: error` (مرفوع للاختبارات) |
| ADR-035: حدود الحزم رباعية الطبقات | `boundaries/dependencies: error` |

## نقاط القوة

- **أنواع صارمة فعليًا**: `tsconfig.json` يفرض `strict: true`
  مع `NodeNext`. لم تُكتشف ملفات `*.ts` تستخدم `any` صراحة عبر اختبارات
  CI الحالية.
- **معالجة أخطاء عبر `Result<T, AppError>`**: نمط `neverthrow` مطبق
  في نقاط الدخول (مثال `apps/bot-server/src/index.ts:23-49`).
- **أسماء معبّرة لا عامة**: حظر الأسماء العامة مثل `utils.ts` ينقل
  المنطق إلى ملفات بأسماء وصفية.
- **حدود الحجم تحفز التقسيم الوظيفي**: 200 سطرًا/ملف و50 سطرًا/دالة
  دفعت بنية الكود نحو modules مفككة.
- **بنية entry point نظيفة في `apps/bot-server/src/index.ts`**: الملف
  ~58 سطرًا، يفوّض لـ `startup/orchestrator.ts` و `startup/deps.factory.ts`.

## ملاحظات على الجودة

| البند | الدليل | الخطورة |
|-------|--------|----------|
| تعليق غير إنجليزي يخالف Rule I (English-only) | `apps/bot-server/src/index.ts:15` يحتوي تعليق عربي `أول شيء يعمل ...` | Low |
| `process.stderr.write` بدلًا من logger مهيكل في مسارات الفشل القاتل | `apps/bot-server/src/index.ts:25-32, 43-50` | Low (مقبول كآلية fallback خام، لكن يستحسن توثيقه) |
| `dist/` و `tsbuildinfo` متتبعة في `apps/bot-server/dist/` | حضور `tsconfig.tsbuildinfo` (228KB) | Low (يفترض أن `.gitignore` يستبعدها؛ التحقق مطلوب) |
| ملفات `.js` متروكة في `packages/*/tests/**` لذا أُضيفت لاستثناءات ESLint | `eslint.config.js:148-149` | Low (يدل على تسرب مخرجات بناء قديم) |
| ملف `bot-terminal.log` في الجذر | الجذر | Low |
| `package.json:` لا يحدد `packageManager` | الجذر | Medium (نقطة استقرار CI) |

## قابلية القراءة والصيانة

- البنية القياسية لكل وحدة (`commands`, `handlers`, `services`,
  `repositories`, `types`, `locales`, `tests`) تجعل الانتقال بين
  الوحدات سلسًا. عينة `modules/user-management/` تظهر كل الأقسام.
- وجود `module.config.ts` و `module.manifest.ts` لكل وحدة يدعم
  إدارة دورة الحياة عبر Module Doctor.
- `i18n` مفروض: لا نصوص نهائية في `.ts`. يقلل من ديون التوطين.

## إدارة الأخطاء

- `neverthrow.Result` هو العقد الرسمي للـ APIs العامة الفاشلة (مذكور
  في `AGENTS.md`، CONTRIBUTING، Constitution).
- نقطة قوة عملية: تسجيل سبب الفشل مع رمز الخطأ في `index.ts` بـ
  `error: depsResult.error.code` يسهل التشخيص.

## استخدام الأنواع

- TypeScript 5.9.3 مثبّت بدقة (Constitution).
- لا أدلة على bypass عبر `as any` أو cast غير آمن في عينات القراءة.
- `bot-server.types.ts` يحتوي ~5KB تعريفات نوعية صريحة، نمط جيد.

## التقييم

- **جودة كود TypeScript عمومًا**: 82%
- **الأنماط البرمجية**: 85%
- **التكرار / DRY**: 80% (تكرار طفيف في scaffolding الوحدات لكنه مبرّر)
- **قابلية القراءة**: 88%
- **قابلية الصيانة**: 82%
- **إدارة الأخطاء**: 85%
- **استخدام الأنواع**: 92%

## توصيات قصيرة (وفق المنهجية)

1. تنظيف الجذر وملفات `dist`/`tsbuildinfo` عبر فرع `codex/repo-hygiene`
   مع PR وثائقي خفيف.
2. تثبيت `packageManager` في `package.json` (مثلًا `pnpm@11.x.y`)
   ضمن Spec #056 (Quality Gates Hardening) كنقطة Toolchain conformance.
3. إصلاح التعليق العربي في `apps/bot-server/src/index.ts:15` ضمن أي
   فرع لـ Spec #056 أو فرع نظافة منفصل.
4. أي تعديل من النوع أعلاه لا يُجرى بدون SpecKit + مراجعة، حتى لو
   كان سطرًا واحدًا، التزامًا بدستور المشروع.
