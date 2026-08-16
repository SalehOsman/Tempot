---
title: هوية وعزل نسخ قالب البوت (Bot Instance Identity)
description: كيفية تسمية وعزل نسخ البوتات المنشأة من قالب تمبوت على نفس خادم Docker
tags:
  - guide
  - docker
  - template
  - operations
audience:
  - bot-developer
  - operator
contentType: developer-docs
difficulty: beginner
---

# هوية وعزل نسخ قالب البوت

يشرح هذا الدليل كيف تكتسب النسخة المنشأة من تمبوت هويتها في بيئة Docker المحلية، وكيفية تغييرها، وكيفية تشغيل عدة نسخ بوتات على نفس السيرفر دون أي تعارض في الأسماء أو المنافذ.

---

## السلوك الافتراضي (Default Behavior)

بعد نسخ `.env.example` إلى `.env`، تكون الهوية المحلية الافتراضية كالتالي:

```env
COMPOSE_PROJECT_NAME=tempot
BOT_HTTP_HOST_PORT=3000
POSTGRES_HOST_PORT=5432
RESTORE_POSTGRES_HOST_PORT=5433
```

---

## تسمية نسخة بوت جديدة وعزلها

قبل أول تشغيل لـ Docker للبوت الجديد، عدّل ملف `.env`:

```env
COMPOSE_PROJECT_NAME=my-customer-bot
BOT_HTTP_HOST_PORT=3001
POSTGRES_HOST_PORT=5434
RESTORE_POSTGRES_HOST_PORT=5435
```

ثم شغّل الخدمات:
```bash
pnpm docker:dev
```

* **قواعد التسمية:** استخدم أحرفاً صغيرة وأرقاماً وشرطات في `COMPOSE_PROJECT_NAME` لأنه يُستخدم في اشتقاق أسماء الحاويات والشبكات وأحجام التخزين (Volumes).

---

## الفرق بين اسم التيليجرام وهوية الدوكر

- **اسم التيليجرام واليوزرنيم:** يتم إدارتها في [@BotFather](https://t.me/botfather) وهي ما يراه المستخدم النهائي.
- **`COMPOSE_PROJECT_NAME`:** هوية محلية لبنية الدوكر التحتية ولا تظهر أبداً لمستخدمي تيليجرام.

---

## تشغيل عدة بوتات على نفس الخادم (Multi-Bot Matrix)

| البوت | `COMPOSE_PROJECT_NAME` | منفذ البوت | منفذ قاعدة البيانات | منفذ الاستعادة |
|---|---|---|---|---|
| البوت الأول | `sales-bot` | `3000` | `5432` | `5433` |
| البوت الثاني | `support-bot` | `3001` | `5434` | `5435` |
| البوت الثالث | `ops-bot` | `3002` | `5436` | `5437` |

---

## روابط الاتصال بقاعدة البيانات (DATABASE_URL)

- **للكود العامل داخل حاوية Docker:**
  `DATABASE_URL=postgresql://tempot:tempot_password@postgres:5432/tempot_db`
- **للكود العامل على جهاز المطور عبر `pnpm dev`:**
  `DATABASE_URL=postgresql://tempot:tempot_password@localhost:5434/tempot_db` (مع مطابقة منفذ المضيف المحدد).

---

## التحقق والفحص

```bash
docker compose config
pnpm template:audit
pnpm check
```
