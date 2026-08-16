# مرجع المتغيرات البيئية (`.env.example`)

> دليل مرجعي شامل لكافة المتغيرات البيئية، مفاتيح التكوين، الأسرار، وإعدادات المزودين في تمبوت.

---

## 📋 نظرة عامة

يقرأ تمبوت كافة تكويناته التشغيلية من ملف `.env` الموجود في جذر المشروع المشتق من [`.env.example`](../../.env.example). يوضح هذا الدليل كافة الأقسام الثمانية بالتفصيل.

---

## القسم 0 — هوية نسخة البوت وبيئة Docker المحلية

| المتغير | القيمة الافتراضية | الوصف |
|---|---|---|
| `COMPOSE_PROJECT_NAME` | `tempot` | مساحة مشروع Docker Compose لعزل الحاويات والشبكات وأحجام التخزين. |
| `BOT_HTTP_HOST_PORT` | `3000` | منفذ خادم Hono HTTP (الـ Webhooks وفحوصات الصحة). |
| `POSTGRES_HOST_PORT` | `5432` | منفذ قاعدة بيانات PostgreSQL الأساسية على جهاز المضيف. |
| `RESTORE_POSTGRES_HOST_PORT` | `5433` | منفذ قاعدة بيانات بروفات الاستعادة المعزولة. |
| `POSTGRES_USER` | `tempot` | اسم مستخدم قاعدة بيانات PostgreSQL. |
| `POSTGRES_PASSWORD` | `tempot_password` | كلمة مرور قاعدة بيانات PostgreSQL. |
| `POSTGRES_DB` | `tempot_db` | اسم قاعدة بيانات PostgreSQL الأساسية. |

---

## القسم 1 — النظام الأساسي وبيئة تشغيل تيليجرام

| المتغير | إلزامي؟ | الوصف |
|---|---|---|
| `BOT_TOKEN` | **نعم** | توكن بوت تيليجرام الصادر من [@BotFather](https://t.me/botfather). |
| `DATABASE_URL` | **نعم** | رابط اتصال PostgreSQL (`postgresql://tempot:tempot_password@localhost:5432/tempot_db`). |
| `REDIS_URL` | **نعم** | رابط اتصال خادم Redis للجلسات والأحداث والطوابير (`redis://localhost:6379`). |
| `SUPER_ADMIN_IDS` | **نعم** | معرفات مستخدمي تيليجرام المفصولين بفواصل والممنوحين صلاحيات الإدارة العليا (`123456789`). |
| `BOT_MODE` | اختياري | وضع التشغيل: `polling` (للتطوير المحلي) أو `webhook` (للإنتاج). |
| `WEBHOOK_URL` | عند الـ Webhook | رابط HTTPS العام لاستقبال تحديثات تيليجرام. |
| `WEBHOOK_SECRET_TOKEN` | عند الـ Webhook | توكن سري للتحقق من أن الطلبات قادمة من خوادم تيليجرام حصراً. |

---

## القسم 2 — التوطين واللغات والإعدادات الإقليمية

| المتغير | القيمة الافتراضية | الوصف |
|---|---|---|
| `DEFAULT_LANGUAGE` | `ar` | اللغة الافتراضية للبوت: `ar` (العربية) أو `en` (الإنجليزية). |
| `DEFAULT_COUNTRY` | `EG` | كود الدولة الافتراضي ISO 3166-1 alpha-2 (`EG`, `SA`, `AE`, `KW`, `JO`). |
| `REGIONAL_MODE` | `static` | وضع المعالجة الإقليمية: `static` (بيانات مدمجة) أو `dynamic`. |

---

## القسم 3 — محرك الذكاء الاصطناعي والمتجهات (AI & Embeddings)

| المتغير | القيمة الافتراضية | الوصف |
|---|---|---|
| `TEMPOT_AI_PROVIDER` | `gemini` | مزود المحادثة الذكية: `gemini` أو `openai` أو `deepseek`. |
| `AI_EMBEDDING_PROVIDER` | `gemini` | مزود حساب المتجهات: `gemini` أو `openai` أو `ollama`. |
| `AI_EMBEDDING_MODEL` | `gemini-embedding-2-preview` | اسم نموذج التضمين المتجهي (مثل `text-embedding-3-large`). |
| `AI_EMBEDDING_DIMENSIONS`| `3072` | أبعاد المتجه (يجب أن تطابق مواصفات النموذج). |
| `GEMINI_API_KEY` | عند اختيار Gemini | مفتاح Google Gemini API. |
| `OPENAI_API_KEY` | عند اختيار OpenAI | مفتاح OpenAI API. |
| `OLLAMA_BASE_URL` | عند اختيار Ollama | رابط خدمة Ollama المحلية (`http://localhost:11434`). |

---

## القسم 4 — مفاتيح تفعيل وتعطيل الحزم (Feature Flags)

للتحكم في تفعيل أو تعطيل الحزم أثناء التشغيل (اضبط القيمة على `false` للتعطيل):

| مفتاح التبديل | القيمة الافتراضية | الحزمة المرتبطة |
|---|---|---|
| `TEMPOT_AUTH` | `true` | `@tempot/auth-core` (صلاحيات CASL) |
| `TEMPOT_SESSIONS` | `true` | `@tempot/session-manager` (جلسات Redis) |
| `TEMPOT_NOTIFIER` | `true` | `@tempot/notifier` (طابور الإشعارات) |
| `TEMPOT_LOGGER` | `true` | `@tempot/logger` (التسجيل والتدقيق) |
| `TEMPOT_AI` | `true` | `@tempot/ai-core` (الذكاء الاصطناعي) |
| `TEMPOT_STORAGE` | `true` | `@tempot/storage-engine` (تخزين الملفات) |
| `TEMPOT_BACKUP` | `true` | `@tempot/backup-engine` (النسخ الاحتياطي) |
| `TEMPOT_REGIONAL` | `true` | `@tempot/regional-engine` (المناطق والأرقام) |
| `TEMPOT_INPUT` | `true` | `@tempot/input-engine` (النماذج التفاعلية) |
| `TEMPOT_DYNAMIC_CMS` | `true` | `@tempot/cms-engine` (نصوص CMS) |
| `TEMPOT_SEARCH` | `true` | `@tempot/search-engine` (البحث النصي) |
| `TEMPOT_DOCUMENTS` | `true` | `@tempot/document-engine` (تصدير المستندات) |
| `TEMPOT_IMPORT` | `true` | `@tempot/import-engine` (استيراد البيانات) |
| `TEMPOT_SENTRY` | `false` | `@tempot/sentry` (تتبع الأخطاء السحابي) |
| `TEMPOT_PAYMENT` | `false` | `@tempot/payment` (بوابات الدفع) |

---

## القسم 6 — مزودات التخزين السحابي (Cloud Storage)

| المتغير | المزود | الوصف |
|---|---|---|
| `STORAGE_PROVIDER` | — | المزود النشط: `local` أو `google-drive` أو `s3`. |
| `STORAGE_LOCAL_PATH` | `local` | مسار المجلد المحلي للمرفقات (`./uploads`). |
| `GOOGLE_DRIVE_CLIENT_ID` | `google-drive` | معرف عميل Google OAuth2. |
| `GOOGLE_DRIVE_CLIENT_SECRET`| `google-drive` | سر عميل Google OAuth2. |
| `GOOGLE_DRIVE_REFRESH_TOKEN`| `google-drive` | توكن تحديث Google OAuth2. |
| `GOOGLE_DRIVE_FOLDER_ID` | `google-drive` | معرف المجلد الهدف في Google Drive. |
| `S3_BUCKET` | `s3` | اسم الحاوية في AWS S3 أو Cloudflare R2. |
| `S3_ACCESS_KEY_ID` | `s3` | مفتاح الوصول لـ S3. |
| `S3_SECRET_ACCESS_KEY` | `s3` | المفتاح السري لـ S3. |
