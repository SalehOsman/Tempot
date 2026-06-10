# 04 - تحليل Docker و DevOps

## ملفات الحاوية

- `apps/bot-server/Dockerfile` — multi-stage (`base`, `builder`, `runner`).
- `docker-compose.yml` — تشغيل محلي + خدمة `bot-server`.
- `.dockerignore` (~238B).

## تقييم Dockerfile

### نقاط القوة

| البند | الدليل |
|-------|--------|
| `node:22-alpine` صورة قاعدة صغيرة | `apps/bot-server/Dockerfile:26` |
| `corepack enable` لإدارة pnpm | السطر 31 |
| `apk add openssl libc6-compat` المطلوب لـ Prisma | السطر 30 |
| build deps محصورة في `builder` فقط (`python3 make g++`) | السطر 41 — runner يبقى نظيفًا |
| `--mount=type=cache,id=pnpm` لتسريع البناء | السطر 45 |
| `pnpm deploy --filter bot-server --prod --legacy /app/out` لعزل بيئة الإنتاج | السطر 58 |
| Prisma generate مرتين بسبب مشكلة pnpm deploy موثقة بشرح طويل | الأسطر 1-25, 60-75 |
| المستخدم غير الجذر `hono:1001` | الأسطر 119-122 |
| `EXPOSE 3000` + `CMD ["node", "dist/index.js"]` | الأسطر 124-125 |

### نقاط الضعف

| البند | الدليل | الخطورة |
|-------|--------|----------|
| لا فحص ثغرات (Trivy/Grype) داخل CI | `docker.yml` | High |
| لا توقيع صورة (cosign) ولا SBOM | `docker.yml` | High |
| `provenance: false` صراحة في docker-push action | `docker.yml:59` | High |
| لا `HEALTHCHECK` داخل Dockerfile (موجود فقط في compose) | `Dockerfile` | Medium |
| منطق ربط الحزم بحلقة `for dir in packages/*/...` هش | الأسطر 97-102 | Medium |
| نسخ كل `packages/*` و `modules/*` إلى الصورة (يضخمها) | السطور 92-114 | Medium |
| نسخ `specs/` إلى الصورة الإنتاجية للتوافق مع validator | السطر 114 | Medium (تسرب أصول حوكمة إلى التشغيل الفعلي) |
| لا `pin` لإصدار محدد لـ `node:22-alpine` بـ digest | السطر 26 | Medium |
| نسخ شجرة المصدر كاملة `COPY . .` ثم بناء | السطر 43 (يعتمد على .dockerignore القوي — يجب التحقق) | Low-Medium |

## تقييم docker-compose.yml

| البند | الدليل |
|-------|--------|
| healthchecks لكل خدمة | السطور 49-54, 68-73, 84-89 — جيد |
| اعتماد `depends_on.condition: service_healthy` | السطور 23-27 — جيد |
| volumes مسماة (`tempot_postgres_data`, `tempot_redis_data`) | السطور 91-95 — جيد |
| تعليق "TODO Phase 5: add bot-server service" متروك رغم وجود الخدمة | السطر 13 — تنظيف توثيقي |
| كلمة مرور Postgres مكشوفة كقيمة افتراضية محلية فقط | السطر 64 — مقبول للتطوير لكن يحتاج تأكيد عدم استخدامه إنتاجًا |
| متغيرات `TEMPOT_*=true` ثابتة في compose | السطور 38-42 — تتعارض مع كون .env هي المصدر الرئيسي |

## تقييم CI/CD (GitHub Actions)

### `.github/workflows/ci.yml`

سبع وظائف: `methodology`, `lint`, `typecheck`, `test-unit`,
`test-integration`, `audit`, `changeset-check`.

نقاط قوة:

- `concurrency` مع `cancel-in-progress`.
- `actions/checkout@v5`, `setup-node@v6` — حديث.
- `pnpm install --frozen-lockfile` لكل وظيفة.
- `pnpm spec:validate`, `pnpm cms:check`, `pnpm boundary:audit`,
  `pnpm module:checklist`, `tempot init`, `tempot doctor --quick`،
  `git diff --check` — حوكمة شاملة.
- خدمات postgres + redis ضمن `test-integration`.
- `audit-level=high` بوابة أمان مفروضة.

نقاط ضعف:

| البند | الدليل | الخطورة |
|-------|--------|----------|
| `NODE_VERSION: '24'` رغم أن `engines >=22.12.0` و Dockerfile يستخدم 22 | `ci.yml:14`, `package.json:5` | Medium (تباعد بين بيئة التطوير والإنتاج وبيئة CI) |
| `pnpm test:unit` و `pnpm test:integration` لا تشمل `apps/*` | تأكدته تدقيق 2026-06-07 | High |
| لا وظيفة لـ `docs:freshness` (مكسور أصلًا) | غير موجودة | Medium |
| لا فحص أمن صورة Docker | `docker.yml` | High |
| لا `setup-buildx-action` cache مدمج مع تحقق digest | `docker.yml:28-29` (cache GHA موجود لكن لا توقيع) | Medium |
| `changeset-check` يعمل فقط على PR — لا تحقق دوري بعد merge | `ci.yml:166-181` | Low |

### `.github/workflows/docker.yml`

- يبني ويدفع إلى GHCR على push to main + tags `v*`.
- استخدام `docker/metadata-action@v5` مع labels جيدة.
- نقاط ضعف ذكرت أعلاه: لا scan، لا sign، لا SBOM، `provenance: false`.

### `.github/workflows/docs-lint.yml`

- يشغل Vale فقط على `docs/product/`. باقي مجلدات التوثيق (developer,
  architecture, operations) غير ملحوظة.

## بيئة التشغيل

`.env.example` (167 سطرًا) وافٍ ومنظم بأقسام مرقمة وتعليقات
تشير إلى أقسام spec المعمارية. ملاحظات:

| البند | الخطورة |
|-------|---------|
| تعليقات تذكر `STORAGE_PROVIDER=s3` مع مفاتيح AWS | Medium (مرغوب لكن يجب تذكير بـ rotation) |
| `WEBHOOK_SECRET_TOKEN` موصوف بأمر إنتاجه عشوائيًا — جيد | Low |
| `TEMPOT_AI=true` افتراضيًا — يستحسن أن يكون `false` للنواة الأقل | Low |

## جاهزية النشر

`docs/operations/deployment.md` يغطي 10 خطوات: env vars، migrations،
docker run، GHCR، webhook registration، health check، Sentry، DB pool،
rollback، go-live checklist.

نقاط قوة: rollback procedure عبر صورة سابقة + `prisma migrate resolve`.
ضعف: لا rehearsal procedure، لا blue-green أو canary، لا backup/restore
موثقة كخطوة قبل الإنتاج.

## التقييم

- **جودة Dockerfile**: 78%
- **جودة docker-compose**: 82%
- **جودة CI**: 80%
- **جودة Docker CI (push & sign)**: 60%
- **جاهزية النشر العامة**: 65%

## توصيات منهجية

كل تحسين Docker/DevOps يندرج تحت **Spec #057 Production Delivery
Hardening** الموجودة فعلًا في `specs/057-production-delivery-hardening/`.
لا يجب فتح فروع متفرقة، بل إضافة tasks ضمن Spec #057 بعد إذن المدير
التقني، ثم تنفيذ كل شريحة (image hardening، signing، SBOM، scan،
deployment runbook) في فرع Superpowers مستقل.
