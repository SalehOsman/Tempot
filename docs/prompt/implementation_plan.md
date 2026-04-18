# إصلاح bot-server — خطة التنفيذ

## الهدف

إصلاح ثلاث مشاكل في `apps/bot-server`:

1. استبدال الـ stubs في `index.ts` بالحزم الحقيقية
2. دمج bot-server في main (يحتاج فحص حالة Git أولاً)
3. حذف `index.d.ts.map` من `src/` (مخالفة Rule LXXVIII)

## تحليل التعقيد

> [!IMPORTANT]
> **المشكلة #1 (الـ stubs) هي مهمة تكامل كبيرة وليست إصلاح بسيط.**
> هي بالأساس Phase 2C في الـ Roadmap: "Integration testing — Validate module-registry + bot-server work together."

### حجم العمل المطلوب لاستبدال الـ Stubs

ملف [index.ts](file:///f:/Tempot/apps/bot-server/src/index.ts) يحتوي **7 stub functions** يجب استبدالها:

| #   | الـ Stub الحالي                         | الحزمة الحقيقية                          | API المطلوب                                                                 | التعقيد                         |
| --- | --------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------- | ------------------------------- |
| 1   | `createStubLogger()`                    | `@tempot/logger`                         | `logger` (pino singleton export)                                            | 🟢 بسيط — import مباشر          |
| 2   | `createStubEventBus()`                  | `@tempot/event-bus`                      | `new EventBusOrchestrator({redis, logger, shutdownManager})` ثم `.init()`   | 🟡 متوسط — يحتاج Redis config   |
| 3   | `createStubAsyncOk()` (connectDatabase) | `@tempot/database`                       | `prisma.$connect()` (implicit via Proxy)                                    | 🟡 متوسط — يحتاج DATABASE_URL   |
| 4   | `bootstrapSuperAdmins` stub prisma      | `@tempot/database` + `@tempot/auth-core` | `prisma.session.upsert()` حقيقي                                             | 🟢 بسيط — prisma import         |
| 5   | `warmCaches` stub warmers               | `@tempot/settings` + `@tempot/i18n-core` | `SettingsService` + `i18n.loadModuleLocales()`                              | 🟡 متوسط — initialization chain |
| 6   | `createStubDiscovery/Validation`        | `@tempot/module-registry`                | `new ModuleRegistry({discovery, validator, eventBus, logger})`              | 🟡 متوسط — needs fs deps        |
| 7   | `createBotWithStubs`                    | Multiple packages                        | Real `MaintenanceService.getStatus()`, `SessionProvider.getSession()`, etc. | 🔴 معقد — يربط كل شيء           |

### تحليل سلسلة التهيئة المطلوبة

الربط الحقيقي يتطلب **ترتيب تهيئة محدد** لأن الحزم تعتمد على بعضها:

```
1. logger          ← singleton, no deps
2. shutdownManager ← needs logger
3. prisma          ← needs DATABASE_URL (env)
4. eventBus        ← needs redis config + logger + shutdownManager
5. cache           ← needs redis (via cache-manager)
6. sessionProvider ← needs cache + eventBus + repository
7. settingsService ← needs prisma + eventBus + cache + logger
8. i18n            ← needs loadModuleLocales()
9. moduleRegistry  ← needs eventBus + logger + fs deps
10. botFactory     ← needs all of the above
```

> [!WARNING]
> **هذا ليس "إصلاح stubs" بسيط — هذا هو تجميع التطبيق بالكامل (Application Assembly).**
>
> وفق المنهجية، هذا يحتاج:
>
> - SpecKit analyze (هل spec #020 يغطي هذا؟)
> - TDD (اختبارات تكامل للربط)
> - Code review
> - Constitution compliance check

---

## User Review Required

> [!CAUTION]
> **قرار مطلوب من مدير المشروع:**
>
> استبدال الـ stubs بالحزم الحقيقية = **Phase 2C كاملة** في الـ Roadmap.
> هذا يعني:
>
> - كتابة كود تكامل حقيقي (~150-200 سطر)
> - اختبارات تكامل جديدة
> - الحاجة لـ Docker يعمل (PostgreSQL + Redis)
> - الحاجة لـ `.env` مكتمل
>
> **هل تريد المضي في هذا المسار الكامل؟ أم تفضل البدء بالمشاكل الأبسط أولاً؟**

---

## الخطة المقترحة — مرحلية

### المرحلة A: الإصلاحات الفورية (لا تحتاج منهجية كاملة)

#### [DELETE] `index.d.ts.map` — مخالفة Rule LXXVIII

ملف `apps/bot-server/src/index.d.ts.map` هو build artifact في مجلد المصدر. يجب حذفه.

#### فحص حالة Git

نحتاج فحص:

- هل bot-server على main أم على feature branch؟
- هل هناك تغييرات غير committed؟
- هل الفرع جاهز للـ merge؟

### المرحلة B: الربط الحقيقي (Index Wiring) — يحتاج Executor Prompt

هذه المرحلة تتطلب **كتابة prompt كامل للمنفذ** يتضمن:

1. **إعادة كتابة `buildDeps()`** لتستخدم الحزم الحقيقية
2. **إنشاء `apps/bot-server/src/startup/deps.factory.ts`** — ملف جديد يبني الـ dependencies الحقيقية بالترتيب الصحيح
3. **تحديث `index.ts`** — يستدعي `deps.factory.ts` بدلاً من الـ stubs
4. **كتابة اختبارات تكامل** — تتحقق أن التهيئة تعمل مع Docker
5. **Documentation Sync** — تحديث spec #020 + ROADMAP

**الملفات المتأثرة:**

- `[MODIFY] apps/bot-server/src/index.ts` — استبدال stubs بـ real deps
- `[NEW] apps/bot-server/src/startup/deps.factory.ts` — factory function للـ dependencies
- `[MODIFY] apps/bot-server/tests/integration/startup-sequence.test.ts` — real integration tests
- `[MODIFY] docs/archive/ROADMAP.md` — تحديث Phase 2C status

---

## Open Questions

> [!IMPORTANT]
>
> 1. **هل Docker (PostgreSQL + Redis) يعمل على جهازك حالياً؟** — الربط الحقيقي يتطلب قاعدة بيانات فعلية.
> 2. **هل تريد البدء بالمرحلة A (الإصلاحات الفورية) فوراً، ثم الانتقال للمرحلة B؟**
> 3. **هل تريد أن أكتب prompt للمنفذ للمرحلة B، أم تمنحني صلاحية التنفيذ المباشر؟**

## Verification Plan

### المرحلة A

- حذف `index.d.ts.map` وعدم وجوده بعد ذلك
- فحص `git status` لمعرفة حالة الفرع

### المرحلة B

- `pnpm test` في `apps/bot-server` — جميع الاختبارات (131+) تنجح
- اختبار تكامل يثبت أن التطبيق يبدأ مع Docker
- `pnpm lint` بدون أخطاء
- لا `any` types في الكود الجديد
