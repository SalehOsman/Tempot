# 14. Roadmap للمراحل القادمة

---

## المرحلة الأولى: Stabilization (أسبوع 1)

**الهدف:** إصلاح المشاكل الحرجة وجعل CI أخضر بالكامل.

| المهمة | الأولوية | المدة | المسؤول |
|---|---|---|---|
| إصلاح WEBHOOK_SECRET_TOKEN | P0 | 5 دقائق | Backend |
| تحديث sanitize-html | P0 | 10 دقائق | Backend |
| إنشاء ملفات template-management المفقودة | P1 | 2-4 ساعات | Backend |
| تحديث devalue (via astro) | P1 | 30 دقيقة | DevOps |
| إزالة SUPER_ADMIN_IDS من docker-compose | P1 | 5 دقائق | DevOps |

**مخرجات المرحلة:**
- `pnpm lint` ✅
- `pnpm build` ✅
- `pnpm test:unit` — 237/237 ✅
- `pnpm audit --audit-level=high` — 0 vulnerabilities ✅
- CI pipeline أخضر بالكامل

**Definition of Done:**
- جميع CI jobs تنجح
- لا يوجد vulnerabilities بمستوى high أو critical
- Docker compose يعمل بدون secrets مكشوفة

---

## المرحلة الثانية: Hardening (أسبوع 2-3)

**الهدف:** تحسين الاستقرار والأداء.

| المهمة | الأولوية | المدة | المسؤول |
|---|---|---|---|
| Parallelize startup (prisma ‖ eventBus) | P2 | 2-4 ساعات | Backend |
| إضافة connection pool limit | P2 | 30 دقيقة | Backend |
| تبسيط Dockerfile find commands | P2 | يوم واحد | DevOps |
| إضافة startup integration test | P2 | يوم واحد | QA |
| إضافة config.loader unit tests | P2 | 2-4 ساعات | QA |
| إضافة webhook route tests | P2 | 2-4 ساعات | QA |

**مخرجات المرحلة:**
- Startup time < 3 seconds
- Dockerfile deterministic بدون find
- Test coverage للـ critical paths

**Definition of Done:**
- Startup test ينجح
- Docker build reproducible
- Performance baseline documented

---

## المرحلة الثالثة: Testing & Quality (أسبوع 3-4)

**الهدف:** رفع تغطية الاختبارات وإضافة quality gates.

| المهمة | الأولوية | المدة | المسؤول |
|---|---|---|---|
| إضافة tests للـ orchestrator | P2 | يوم واحد | QA |
| إضافة tests للـ error-boundary | P2 | 2-4 ساعات | QA |
| إضافة tests للـ health probes | P2 | 2-4 ساعات | QA |
| إضافة smoke test (Docker) | P3 | يوم واحد | DevOps |
| إعداد coverage threshold في CI | P3 | 2-4 ساعات | DevOps |
| إضافة Ability caching | P3 | 2-4 ساعات | Backend |

**مخرجات المرحلة:**
- Coverage > 75% للـ critical paths
- Smoke test يتأكد من Docker build + health endpoint
- Performance optimizations applied

**Definition of Done:**
- Coverage report available
- All new features have tests
- No regression

---

## المرحلة الرابعة: Production Readiness (أسبوع 5-6)

**الهدف:** تجهيز المشروع للنشر والإدارة.

| المهمة | الأولوية | المدة | المسؤول |
|---|---|---|---|
| إضافة CD pipeline (Docker build + push) | P2 | يوم واحد | DevOps |
| كتابة Deployment Guide | P3 | يوم واحد | Tech Lead |
| إعداد database migration strategy | P3 | يوم واحد | Backend |
| إعداد monitoring (Sentry + health dashboard) | P3 | 2-3 أيام | DevOps |
| إضافة rollback strategy | P3 | يوم واحد | DevOps |
| إضافة backup/restore docs | P3 | يوم واحد | DevOps |
| إضافة zod validation per-command | P2 | 3-5 أيام | Backend |

**مخرجات المرحلة:**
- Automated deployment pipeline
- Monitoring + alerting
- Runbook documentation

**Definition of Done:**
- One-click deploy from main branch
- Alerts fire on unhealthy state
- Rollback tested and documented

---

## المرحلة الخامسة: Scaling & Advanced Features (مستمر)

**الهدف:** تحسين قابلية التوسع وإضافة مزايا مستقبلية.

| المهمة | الأولوية | المدة | المسؤول |
|---|---|---|---|
| Rate limiter → Redis backend | P3 | 2-4 ساعات | Backend |
| Module port interface (reduce peer deps) | P3 | 3-5 أيام | Architect |
| Webhook mode testing + docs | P3 | يوم واحد | Backend |
| Multi-bot support (bot-management activation) | P4 | أسبوع+ | Backend |
| Dashboard frontend | P4 | أسابيع | Frontend |
| Mini apps | P4 | أسابيع | Frontend |

**مخرجات المرحلة:**
- Horizontal scaling ready (webhook mode + Redis rate limiter)
- Module coupling reduced
- SaaS foundations activated (when Product decides)

**Definition of Done:**
- Load test passes with 2+ instances
- Module development is plug-and-play
