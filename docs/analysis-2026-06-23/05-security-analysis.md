# 05 - تحليل الأمان

## 1. الإطار الدستوري

الدستور يُكرّس عشر قواعد أمنية صريحة (XXV–XXXIII، LXXIV، LXXV):

- Security by default: chain آلي `sanitize-html → rate-limit → CASL → Zod → business → audit`.
- CASL-based RBAC مع أربعة أدوار صارمة وهرمية (`GUEST/USER/ADMIN/SUPER_ADMIN`).
- Soft delete عبر `$extends()` لا middleware.
- Secure bootstrap: `SUPER_ADMIN` فقط من `SUPER_ADMIN_IDS`.
- Rate limiting بثلاث طبقات بأدوات مستقلة (`@grammyjs/ratelimiter`, `rate-limiter-flexible`, `hono-rate-limiter`).
- Input sanitization عبر `sanitize-html`.
- Encryption: bcrypt للكلمات، AES-256 للحقول الحساسة، تشفير النسخ الاحتياطية، عدم تخزين API keys في كود.
- Redis/AI degradation strategies.

## 2. التعامل مع الأسرار (Secrets)

| الجانب                                       | الحالة                                                                                                 |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| استبعاد `.env` من git                        | ✅ `.gitignore` يستبعد `.env`, `.env.*` مع استثناء `!.env.example`.                                     |
| `.env` يدخل صورة الـ Docker؟                  | ❌ `Dockerfile` لا ينسخه. `docker-compose.yml` يستخدم `env_file: .env` عند التشغيل المحلي فقط.        |
| إفصاح صريح في `.env.example`                 | ✅ "Never commit .env to version control".                                                              |
| Protected data keys                          | ✅ `PROTECTED_DATA_ENCRYPTION_KEYS` و`PROTECTED_DATA_LOOKUP_KEYS` JSON maps مع version IDs، Rule XXXI.   |
| BOT_TOKEN في `.env` الحقيقي محليًا           | ⚠️ ملاحظ على القرص بطول 5786 بايت — يحتوي قيمة فعلية. على المطور أن يدوّر الـ token دوريًا.            |
| `WEBHOOK_SECRET_TOKEN` توليدها              | ✅ `.env.example` يوثق `node -e "..."` لـ random bytes hex.                                            |

## 3. التشفير

- `PROTECTED_DATA_ACTIVE_ENCRYPTION_KEY_VERSION` + `PROTECTED_DATA_ENCRYPTION_KEYS` (JSON: version → base64 32-byte key) متطلب صريح قبل أي كتابة لبيانات شخصية محمية.
- ADR-044 `sensitive-data-protection.md` يوثّق السياسة (5446 بايت).
- Spec #054 (Sensitive Data Protection) **دُمج إلى origin/main** بحسب ROADMAP 2026-06-16، مع بقاء target backup rehearsal + staging verification + production cutover gates.

## 4. المصادقة والتفويض

- **المصادقة:** عبر Telegram (BOT_TOKEN). الـ identity هو Telegram user id.
- **التفويض:** CASL ability factory في كل وحدة (`abilities.ts`). فحص الصلاحيات في `BaseRepository` (Rule XXVI).
- `SUPER_ADMIN_IDS` (CSV) يُحدد SUPER_ADMIN في الـ bootstrap.
- Spec #053 (Authorization Correction) **مُدمج** — أصلح `manage all` global authorization المتسرّب.

### 4.1 ثغرات سابقة معالجة

| الثغرة                                                                                                | الحل                                                              | الحالة     |
| ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ---------- |
| `can('manage', 'all')` كان يحجب جميع غير-SUPER_ADMIN من الفعل قبل Spec #053.                         | Spec #053 + `authorization-coverage-audit.ts` (4485 بايت).         | ✅ مُغلَق  |
| بيانات شخصية بدون تشفير في `user-management` (national id, email, phone, dates).                       | Spec #054 + ADR-044 + Protected data keys.                        | ✅ مُغلَق (التطبيق)؛ ⚠️ backup rehearsal pending |
| `bot-server` tests لم تكن مشمولة في CI الجذر؛ كشف audit 2026-06-07 فشلين فعليين.                       | Spec #056 (quality-gates-hardening).                              | ✅ مُغلَق  |
| Data integrity في تحديثات هوية متعددة الحقول كمعاملات منفصلة + تجاوز فلتر soft-delete.                 | Spec #055 (data-integrity-hardening).                             | ✅ مُغلَق  |

## 5. Supply Chain Security

| البند                                                  | الحالة                                                                                                         |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| pnpm `overrides` لإجبار إصدارات مرقَّعة لـ CVEs        | ✅ في `package.json` (devalue, esbuild, @hono/node-server, protobufjs, tmp, @grpc/grpc-js, vite, qs, undici, markdown-it). |
| frozen-lockfile في CI و Docker                         | ✅ `pnpm install --frozen-lockfile`.                                                                            |
| `pnpm audit --audit-level=high` في CI                  | ✅ job منفصل.                                                                                                  |
| تجاهلات CVE/GHSA الموثقة                                | ✅ `pnpm.auditConfig.ignoreCves` (`CVE-2026-53550`) و`ignoreGhsas` (`GHSA-h67p-54hq-rp68`).                       |
| Trivy على image                                        | ✅ HIGH/CRITICAL = build fail.                                                                                  |
| SBOM                                                   | ✅ مولَّد من buildx + provenance.                                                                                |
| Cosign sign + verify                                   | ✅ keyless OIDC.                                                                                                |
| إزالة pnpm/npm من image التشغيل                        | ✅ Dockerfile السطور 138–146.                                                                                   |
| Non-root user                                          | ✅ `USER hono` UID 1001.                                                                                        |

## 6. ملاحظات وثغرات متبقية

| رقم | المشكلة                                                                                                       | الخطورة | الدليل                                                                                          |
| --- | ------------------------------------------------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------- |
| S1  | لا توقع/تحقق Cosign عند الـ runtime (الـ verify يحدث في pipeline البناء فقط).                                  | Medium  | `docker.yml` step "Verify image signature" — لا يوجد admission controller.                      |
| S2  | لا يوجد فحص للأمان على `pnpm-lock.yaml` بنوع osv-scanner كمكمل لـ `pnpm audit`.                                  | Low     | `ci.yml` audit job.                                                                            |
| S3  | الـ `.env` الفعلي على الـ host يحوي tokens حقيقية. غير مرفوع لكنه يجب أن يكون duty-of-care يومية للمطور.        | Medium  | `F:\Tempot\.env`.                                                                              |
| S4  | لا توجد `secrets scanning` workflow (مثل gitleaks/trufflehog) في CI لمنع التسرب المستقبلي.                       | Medium  | `.github/workflows/`.                                                                          |
| S5  | متغيرات `PROTECTED_DATA_ENCRYPTION_KEYS` لا تتضمن آلية تدوير زمنية موثقة (rotation cadence).                    | Medium  | `.env.example` يذكر `version` لكن لا cadence.                                                  |
| S6  | لا توجد سياسة محددة لـ `Telegram BOT_TOKEN` rotation.                                                          | Medium  | `docs/security/` (تحقق إنشائه).                                                                |
| S7  | docker-compose يثبّت كلمات سر Postgres ثابتة. يجب توضيح "dev-only" بشكل صارم في README وVHS-banner عند الإقلاع. | Low     | `docker-compose.yml:39`.                                                                       |
| S8  | تعليقات بالعربية في ملفات الـ src تخالف Rule XL — ليست ثغرة أمنية مباشرة، لكنها تكشف صعوبة code review الأمني.   | Low     | `modules/user-management/abilities.ts:1–10`.                                                   |

## 7. توصيات أمنية مرتبة بالأولوية

> كل توصية يجب أن تمرّ عبر منهجية SpecKit + Superpowers. الحجم المتوقع لكل واحدة صغير، يمكن دمجها في spec واحد أمني بعنوان مقترح `059-security-hardening-followups`.

### الأولوية 1 (P0)

| #  | التوصية                                                                                          | السبب                                                                                |
| -- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| 1  | إضافة `gitleaks` أو `trufflehog` job إلى `ci.yml` (push + PR).                                    | يمنع تسرب مستقبلي لأسرار في commits.                                                |
| 2  | توثيق سياسة `BOT_TOKEN` rotation (كل 90 يوم على الأكثر) داخل `docs/security/` + reminder سنوي.   | يقلل blast radius عند تسرب محتمل.                                                  |
| 3  | توثيق `PROTECTED_DATA_*` key rotation cadence مع runbook موجز.                                    | يحوّل Rule XXXI من مبدأ إلى عملية.                                                  |

### الأولوية 2 (P1)

| #  | التوصية                                                                                                                   | السبب                                                              |
| -- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 4  | إضافة OSV scanner كمكمل لـ `pnpm audit` (يرصد مصادر أوسع للثغرات).                                                         | تغطية إضافية بدون استبدال.                                          |
| 5  | إضافة admission/cosign verification عند الـ deploy (Kubernetes admission controller أو سكربت deploy).                       | يطبق Zero-Trust على chain النشر، لا البناء فقط.                     |
| 6  | تعزيز runbook لـ Redis degradation + AI degradation circuit-breaker قابل للقراءة على pager.                                 | Rule XXXII/XXXIII موجودة دستوريًا لكنها تحتاج تطبيق playbook.       |

### الأولوية 3 (P2)

| #  | التوصية                                                                                              | السبب                                                                 |
| -- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 7  | تحويل compose dev secrets إلى `.env` مع warning مكتوب في README "dev-only" + استخدام BuildKit secrets. | يقلل احتمال نسخ الـ compose إلى بيئة شبه-إنتاج عن طريق الخطأ.        |
| 8  | إضافة Dependabot/Renovate config (إن لم يكن موجودًا) لتحديث تلقائي للـ deps الأمنية.                  | يقلل تأخر الترقيع.                                                    |
| 9  | تطبيق `helmet`-equivalent على Hono (CORS strict، Content-Security-Policy، X-Frame-Options).            | بعض ذلك مفعَّل (ADR-030 + Spec #057 secure headers) — تأكيد التغطية.    |

## 8. خلاصة

الأمان في Tempot **مبني-بالتصميم** (security-by-default chain، CASL، Result Pattern، protected data keys، supply chain hardening). البقايا هي **عمليات متابعة (operational followups)** وليست ثغرات تصميمية. يمكن دمجها في spec أمني واحد متوسط الحجم بعد إغلاق #057 و#058 الحاليين.
