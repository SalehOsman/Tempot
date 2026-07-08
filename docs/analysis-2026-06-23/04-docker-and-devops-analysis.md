# 04 - تحليل Docker و DevOps

## 1. الملفات المعنية

| الملف                                  | الدور                                                                        |
| -------------------------------------- | ---------------------------------------------------------------------------- |
| `docker-compose.yml`                   | Stack محلي: bot-server + Postgres 16 (pgvector) + Redis 7.                   |
| `apps/bot-server/Dockerfile`           | Multi-stage build (base → builder → runner).                                 |
| `.dockerignore`                        | استبعاد artifacts والـ env من سياق البناء.                                    |
| `.github/workflows/ci.yml`             | Methodology + lint + typecheck + tests + audit + changeset.                  |
| `.github/workflows/docker.yml`         | Build + Trivy scan + Cosign sign + verify.                                   |
| `.github/workflows/docs-lint.yml`      | فحص توثيق Starlight.                                                         |

## 2. Dockerfile (`apps/bot-server/Dockerfile`)

### 2.1 المراحل

1. **base** (Alpine + Node 22.12 + pnpm): تركيب `openssl` و`libc6-compat` لـ Prisma library engine.
2. **builder**:
   - تركيب `python3 make g++` لـ native bindings.
   - `pnpm install --frozen-lockfile` (بـ cache mount).
   - `pnpm --filter @tempot/database exec prisma generate` (للسماح لـ tsc بحل أنواع Prisma).
   - `pnpm build:bot-runtime` (يبني فقط الـ runtime، يستثني `docs`).
   - `pnpm runtime:manifest` (يولّد `runtime-manifest.json` المعتمد عليه ModuleValidator).
   - تركيب runtime tree (`modules/*/dist+locales`, `packages/*/dist+package.json+prisma`) مع حذف `.d.ts` و`.map`.
   - `pnpm deploy --filter bot-server --prod --legacy /app/out`.
   - إعادة توليد Prisma client داخل `/app/out` (لتفادي مشكلة peer-dep hash المختلف).
3. **runner**:
   - يضع `NODE_ENV=production`.
   - ينسخ `dist`، `node_modules` (من deploy)، `runtime-manifest.json`، `packages/`، `modules/`، `apps/bot-server/locales`.
   - يربط symlinks لحزم workspace في `node_modules/@tempot/*` إن لم تكن موجودة.
   - **يحذف pnpm/npm/npx/corepack** من صورة التشغيل لتقليل CVE surface.
   - ينشئ مستخدم `hono` غير-root (UID 1001) ويعمل تحته (Rule X).
   - `EXPOSE 3000`.
   - `CMD ["node", "dist/index.js"]`.

### 2.2 نقاط القوة

| البند                                                   | الدليل                                                         |
| ------------------------------------------------------- | -------------------------------------------------------------- |
| Multi-stage يفصل أدوات البناء عن صورة التشغيل.            | builder vs runner.                                             |
| pnpm cache mount لتسريع البناء.                          | `RUN --mount=type=cache,id=pnpm,target=/pnpm/store ...`        |
| Frozen lockfile يضمن determinism.                       | `pnpm install --frozen-lockfile`.                              |
| إزالة .d.ts/.map من runtime tree.                        | `find /app/runtime -name '*.d.ts' -delete`.                    |
| إسقاط pnpm/npm من الصورة النهائية.                       | تقليل CVE surface (Rule 11–12 OWASP supply chain).             |
| Non-root user.                                          | `USER hono` (Rule X).                                          |
| توثيق المنطق المعقد لـ Prisma+pnpm deploy.               | تعليقات تفصيلية أعلى Dockerfile.                                |

### 2.3 ملاحظات

| البند                                                                                                                                    | الخطورة |
| ----------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| لا يوجد `HEALTHCHECK` داخل Dockerfile نفسه (يعتمد على docker-compose only).                                                                | Low     |
| `python3 make g++` تُترك متاحة فقط في builder — جيد، لكنها تكبّر طبقة intermediate (مقبول).                                                  | Low     |
| `pnpm install --frozen-lockfile` يجري على كامل الـ monorepo قبل `pnpm deploy`. وقت البناء قابل للتحسين عبر `--filter bot-server...`.       | Low     |
| Re-generate Prisma داخل `/app/out` فعّال لكنه يعتمد على ثبات بنية `node_modules/.pnpm/node_modules/.bin/`؛ توثيقه أعلى Dockerfile ممتاز.   | Low     |

## 3. docker-compose.yml

### 3.1 الخدمات

| الخدمة      | الصورة                          | الدور                                                                       |
| ----------- | ------------------------------- | --------------------------------------------------------------------------- |
| bot-server  | يُبنى محليًا من `Dockerfile`     | يطبق Prisma migrations ثم يشغّل `node dist/index.js`.                       |
| postgres    | `pgvector/pgvector:0.8.2-pg16`  | DB مع امتداد pgvector.                                                       |
| redis       | `redis:7-alpine`                | كاش + جلسات + queue.                                                        |

### 3.2 نقاط القوة

- **Healthchecks** على جميع الخدمات (Rule XVII).
- **depends_on: condition: service_healthy** يضمن ترتيب التشغيل.
- **bot-server bound to `127.0.0.1:3000`** (ليس `0.0.0.0`) → آمن للمحلي.
- **Internal Redis** بدون نشر منفذ خارجي → يتجنب التعارض مع Redis مستضيف.
- **Migrations عند الإقلاع** عبر `prisma migrate deploy` قبل `node dist/index.js`.
- **Volumes مسماة** لـ `postgres_data` و`redis_data` → يبقى البيانات بين runs.

### 3.3 ملاحظات

| البند                                                                                                                         | الخطورة |
| ----------------------------------------------------------------------------------------------------------------------------- | ------- |
| كلمة مرور Postgres ثابتة `tempot_password` في compose. مقبول للتطوير المحلي، لكن يجب أن يُذكر صراحةً أنها dev-only.            | Low     |
| متغيرات `TEMPOT_INPUT/DYNAMIC_CMS/SEARCH/DOCUMENTS/IMPORT=true` مفعّلة افتراضيًا في compose، بينما `.env.example` تتركها `false`. | Medium  |
| البقع التعليقية على webhook mode (`# BOT_MODE=webhook`) مفيدة لكنها تتطلب توثيقًا أوضح عن أمن `WEBHOOK_SECRET_TOKEN`.            | Low     |
| لا يوجد resource limits (`mem_limit`, `cpus`) لأي خدمة → في الإنتاج عبر Compose يحدث memory pressure.                          | Medium  |

## 4. CI (`.github/workflows/ci.yml`)

### 4.1 Jobs

| Job                  | الدور                                                                                                          |
| -------------------- | -------------------------------------------------------------------------------------------------------------- |
| `methodology`        | يشغّل `spec:validate`, `cms:check`, `boundary:audit`, `authorization:check`, `module:checklist`, `source:conformance`, `toolchain:audit`, `docs:check`, `tempot init`, `tempot doctor --quick`, ويفحص whitespace. |
| `lint`               | `pnpm lint`.                                                                                                  |
| `typecheck`          | matrix: Node 22.12.0 و 24. يولّد Prisma client ثم `pnpm build`.                                                |
| `test-unit`          | matrix: Node 22 و 24. يبني، يجري `test:inventory`، ثم `test:unit`.                                              |
| `test-integration`   | Services: Postgres + Redis. يجري `prisma db push` ثم `test:integration` و`test:e2e`.                            |
| `coverage`           | يعتمد على `test-integration`. يجري `pnpm test:coverage` مع نفس Services.                                       |
| `audit`              | `pnpm audit --audit-level=high`.                                                                              |
| `changeset-check`    | يفعّل فقط على PR. يجري `pnpm changeset status --since=origin/main`.                                            |

### 4.2 نقاط القوة

- Matrix testing على Node 22.12 و24 يكشف مشاكل التوافق المستقبلي.
- `concurrency` مع `cancel-in-progress` يقلل تكلفة الـ CI.
- بوابة Methodology قبل الكود = "spec.gate" حقيقي.
- coverage job مفصول عن test-integration ويتطلب اجتيازه (blocking بحسب ROADMAP 2026-06-17).
- Audit بمستوى high.

### 4.3 ملاحظات

| البند                                                                                                                              | الخطورة |
| ---------------------------------------------------------------------------------------------------------------------------------- | ------- |
| لا توجد بوابة `pnpm audit-ci` أو `osv-scanner` (مكمل لـ `pnpm audit`).                                                              | Low     |
| لا يوجد upload لـ coverage إلى أداة خارجية (Codecov/Coveralls) لمراجعة بصرية تاريخية. الـ artifact موجود محليًا فقط في `coverage/`.   | Low     |
| `test-unit` تحت matrix [22.12, 24] لكن `test-integration` تستخدم `NODE_VERSION` الافتراضي فقط — معقول لتقليل التكلفة.                | Low     |
| لا يوجد فحص بنية الأقفال (`pnpm-lock.yaml` integrity beyond frozen-lockfile)؛ يكفي frozen-lockfile لكن يُستحب `verify-store-integrity`. | Low     |

## 5. Docker workflow (`.github/workflows/docker.yml`)

| البند                                       | الحالة                                                                                          |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Trigger                                     | push to main + tags `v*`.                                                                       |
| Build & Push                                | إلى GHCR مع SBOM + provenance.                                                                  |
| Image scan                                  | `aquasecurity/trivy-action` بـ `severity: HIGH,CRITICAL`, `exit-code: 1`.                       |
| SARIF upload                                | `github/codeql-action/upload-sarif@v4`.                                                         |
| Cosign install                              | بإصدار مثبّت SHA.                                                                              |
| Cosign sign                                 | على digest الصورة (keyless OIDC).                                                              |
| Cosign verify                               | يطابق certificate-identity-regexp + OIDC issuer.                                                |

> هذا يُعدّ من بين أفضل ممارسات supply-chain hardening لمشاريع مفتوحة المصدر — Trivy + SBOM + Cosign + verify كلها في pipeline واحدة وموثقة.

### 5.1 ملاحظات

- لا يوجد deploy job يبني rollout على staging/production تلقائيًا — وفق `docs/ROADMAP.md`، النشر اليدوي مع gates موثَّق متعمد.
- لا يوجد cosign verify عند الـ deploy time (الـ pipeline يتحقق وقت البناء فقط). لو نُضمَّن في compose/orchestrator، يحقق zero-trust أعلى.

## 6. متغيرات البيئة

`.env.example` يمتاز بتنظيم احترافي:

- مقسَّم إلى 7 أقسام مرقمة.
- نجمة `*` لكل متغير إلزامي.
- توثيق طريقة توليد `WEBHOOK_SECRET_TOKEN` عبر crypto.
- مرتبط بـ Sections من `docs/architecture/tempot_architecture.md`.

> **ملاحظة:** `.env` الحقيقي على `F:\Tempot\.env` يحوي `BOT_TOKEN` و`SUPER_ADMIN_IDS` حقيقيين. الملف **مستبعد عبر `.gitignore`** وفُحص — لم يُتعقَّب بـ git. لا تسريب فعلي، لكنه دعوة للمستخدم لتدوير الـ token بعد فترة وعدم نسخه إلى أماكن أقل أمنًا.

## 7. جاهزية النشر

| البند                                                    | الحالة                                                                                              |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Image build/push                                        | ✅ آلي عند push to main.                                                                            |
| SBOM                                                    | ✅ مولَّد عبر buildx.                                                                                |
| Image scan (Trivy)                                       | ✅ يفشل البناء على HIGH/CRITICAL.                                                                   |
| Image signing (Cosign)                                   | ✅ keyless OIDC + verify.                                                                           |
| Health endpoints                                         | ✅ `/live` + `/ready` (طبق ROADMAP 2026-06-18 evidence).                                            |
| Migrations عند الإقلاع                                    | ✅ `prisma migrate deploy` في command compose.                                                      |
| Graceful Shutdown                                        | ✅ `packages/shared/src/shutdown/`.                                                                  |
| Rate limiting                                            | ✅ Rule XXIX + `@grammyjs/ratelimiter` + `rate-limiter-flexible` + `hono-rate-limiter`.              |
| Backup/Restore على بيانات إنتاجية هدف                     | ⚠️ غير مُغلق بعد (Spec #057 T032+).                                                                 |
| Staging real rehearsal                                   | ⚠️ غير مُسجَّل بعد كـ go/no-go evidence.                                                            |
| Production go/no-go log                                  | ⚠️ بانتظار اعتماد.                                                                                  |

## 8. CI/CD: التقييم

- **الحضور التقني:** ممتاز — توقيع صور، SBOM، Trivy، matrix Node، Methodology gates.
- **النضج التنظيمي:** عالٍ — bound إلى المنهجية الدستورية بشكل مباشر.
- **الثغرة المتبقية الوحيدة:** إثبات النشر النهائي (staging حقيقي + backup/restore + rollback + go/no-go).

## 9. خلاصة

Docker و DevOps في Tempot من **أفضل ما يُرى في مشاريع TypeScript Monorepo** على هذا الحجم. الثغرة هي **تنفيذية إجرائية فقط**، وليست تصميمية. باستكمال Spec #057 المتبقي، يمكن للمشروع إصدار `v1.0` بثقة.
