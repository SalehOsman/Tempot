# 05 - تحليل الأمان

## نقاط القوة الأمنية

| البند | الدليل |
|-------|--------|
| سياسة أمنية موثقة | `SECURITY.md` (تقارير عبر GitHub Security Advisories) |
| Pipeline أمن مرئي: sanitize-html → rate-limit → CASL → Zod → audit | `SECURITY.md:37-50` |
| overrides أمنية صريحة لمعالجة CVEs | `pnpm-workspace.yaml:15-29` (`devalue`, `esbuild`, `@hono/node-server`, `protobufjs`, `tmp`) |
| `pnpm audit --audit-level=high` كبوابة CI ملزمة | `.github/workflows/ci.yml:150-163` |
| المستخدم غير الجذر `hono:1001` في الصورة | `apps/bot-server/Dockerfile:119-122` |
| `WEBHOOK_SECRET_TOKEN` موجه نحو إنتاج عشوائي قوي | `.env.example:40-41` |
| Pino + سياسة "no console.* in src" | `eslint.config.js:83` |
| CASL للتفويض، Zod للتحقق، sanitize-html للإدخال | `apps/bot-server/package.json` |

## نقاط الضعف الأمنية المؤكدة

### 1. التفويض المعطل عمليًا (Critical)

**الدليل**: تدقيق 2026-06-07 (موثق في
`docs/project-analysis/2026-06-07/README.md:97-100`) رصد أن middleware
عام في `apps/bot-server` يتطلب `manage all` لكل تحديث، بينما تلك
القدرة لا تُمنح إلا لـ SUPER_ADMIN. النتيجة: كل المستخدمين العاديين
محجوبون من البوت.

**الحالة المنهجية**: مغطى بـ Spec #053 (Authorization Correction)،
SpecKit gates مرت لكن التنفيذ لم يبدأ.

### 2. بيانات شخصية حساسة بلا تشفير (Critical)

**الدليل**: نفس التدقيق (السطور 101-103) — البريد، الهاتف، الهوية
الوطنية، تواريخ الميلاد مخزنة plaintext وتُنسخ في سجلات تدقيق ثابتة.

**الحالة المنهجية**: مغطى بـ Spec #054 (Sensitive Data Protection).
يحتاج ADR + خطة ترحيل + خطة دوران مفاتيح.

### 3. تكامل البيانات (High)

**الدليل**: تحديث الهوية متعدد الحقول كمعاملات منفصلة. مغطى بـ Spec #055.

### 4. صور Docker بلا توقيع/SBOM/فحص (High)

**الدليل**: `.github/workflows/docker.yml:59` — `provenance: false`.
لا cosign، لا syft/grype/trivy. أي اعتراض في supply chain لن يكتشف.

**الحالة المنهجية**: ضمن Spec #057.

## ملاحظات أمنية أخرى

| البند | الدليل | الخطورة |
|-------|--------|----------|
| `.env` (5232 بايت) موجود في الجذر — يجب التأكد من `.gitignore` يستبعده | الجذر | High إذا تم commit (يفترض لا، لكن وجود الملف ينبه) |
| كلمة مرور Postgres ثابتة `tempot_password` في compose و Dockerfile env | `docker-compose.yml:31`, `:64` | Low (للتطوير المحلي فقط، لكن يستحسن إخفاؤها حتى محليًا) |
| لا CSP/headers صارمة موثقة لـ Hono endpoints | لم يُعثر على middleware headers في عينات | Medium |
| لا توثيق لـ secret rotation cadence | `SECURITY.md` يذكر "regularly" دون SLA | Low |
| لا توثيق لـ DPIA أو سجل معالجة بيانات شخصية رغم وجود قاعدة هوية وطنية | غياب | Medium |
| لا مسح SAST تلقائي (CodeQL, Semgrep) في CI | `.github/workflows/` | Medium |
| لا Dependabot/Renovate في `.github/` | غياب | Medium |

## تحليل التعامل مع الأسرار

- `.env` و `.env.example` منفصلان. جيد.
- `docker-compose.yml` يقرأ `env_file: .env` ويدعم متغيرات shell
  override. جيد.
- لا secrets manager (Vault/AWS SM/Doppler) موثق — مقبول لمشروع
  single-bot template، لكن يجب توثيق نمط الإنتاج المتوقع.

## التقييم

- **حماية الأسرار**: 78%
- **الاعتماديات والـ CVEs**: 85% (overrides واعية)
- **التفويض الفعلي**: 40% (بسبب Spec #053)
- **حماية البيانات الحساسة**: 45% (بسبب Spec #054)
- **سلسلة إمداد الصور**: 50%
- **مسح أمن دوري آلي**: 55%
- **الإجمالي الأمني**: 62%

## التوصيات الأمنية مرتبة بالأولوية

| الأولوية | التوصية | المسار المنهجي |
|---------|---------|------------------|
| P0 | تنفيذ Spec #053 (Authorization Correction) | الفرع المعتمد، Superpowers |
| P0 | تنفيذ Spec #054 (Sensitive Data Protection) | يحتاج ADR + key runbook |
| P1 | إضافة Trivy/Grype + cosign + SBOM إلى docker.yml | Spec #057 task جديد |
| P1 | تفعيل CodeQL على المستودع | Spec #056 task |
| P1 | تفعيل Dependabot أو Renovate لـ `package.json` و GitHub Actions | Spec #056 task |
| P2 | توثيق Secret Rotation SLA + إنتاج runbook في `docs/operations/` | تحديث وثائقي عبر CONTRIBUTING |
| P2 | تأكيد أن `.env` في `.gitignore` فعلًا، وحذف أي نسخة منسوخة سابقًا من تاريخ git | فحص history منفصل |

كل التوصيات تتم عبر منهجية SpecKit + Superpowers، ولا يجب تنفيذ أي
منها مباشرة على main.
