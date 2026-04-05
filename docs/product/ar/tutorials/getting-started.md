---
title: البدء مع تمبوت
description: دليل تعليمي خطوة بخطوة لبناء أول بوت تيليجرام باستخدام منصة تمبوت
tags:
  - tutorial
  - getting-started
  - beginner
audience:
  - bot-developer
contentType: developer-docs
difficulty: beginner
---

## المتطلبات الأساسية

قبل البدء، تأكد من توفر ما يلي:

- **Node.js** الإصدار 20 أو أحدث
- **pnpm** مدير الحزم
- **PostgreSQL** الإصدار 16
- **Redis** للجلسات وقوائم الانتظار
- حساب على **Telegram** مع توكن بوت من [@BotFather](https://t.me/BotFather)

## إنشاء مشروع جديد

### الخطوة الأولى: استنساخ المستودع

```bash
git clone https://github.com/SalehOsman/Tempot.git
cd Tempot
pnpm install
```

### الخطوة الثانية: إعداد المتغيرات البيئية

أنشئ ملف `.env` في جذر المشروع:

```bash
cp .env.example .env
```

عدّل الملف وأضف توكن البوت وبيانات قاعدة البيانات:

```
BOT_TOKEN=your_bot_token_here
DATABASE_URL=postgresql://user:password@localhost:5432/tempot
REDIS_URL=redis://localhost:6379
```

### الخطوة الثالثة: إعداد قاعدة البيانات

```bash
pnpm db:migrate
pnpm db:seed
```

### الخطوة الرابعة: تشغيل البوت

```bash
pnpm dev
```

سيبدأ البوت بالعمل وسترى في وحدة التحكم رسائل التسجيل (logging) تؤكد نجاح الاتصال.

## البنية الأساسية للمشروع

يتبع تمبوت بنية Monorepo باستخدام pnpm workspaces:

```
Tempot/
├── apps/
│   └── bot-server/          # تطبيق البوت الرئيسي
├── packages/
│   ├── shared/              # أدوات وأنواع مشتركة
│   ├── logger/              # نظام التسجيل (Pino)
│   ├── event-bus/           # ناقل الأحداث
│   ├── auth-core/           # نظام الصلاحيات (CASL)
│   ├── database/            # طبقة قاعدة البيانات (Prisma)
│   ├── session-manager/     # إدارة الجلسات
│   ├── i18n-core/           # نظام الترجمة
│   ├── ai-core/             # تكامل الذكاء الاصطناعي
│   └── module-registry/     # سجل الوحدات
├── modules/                 # وحدات الأعمال
└── docs/                    # التوثيق
```

## الخطوات التالية

بعد تشغيل البوت بنجاح، يمكنك:

- قراءة دليل [إنشاء وحدة جديدة](/ar/guides/creating-a-module/) لتعلم كيفية إضافة وظائف مخصصة
- مراجعة [نظرة عامة على البنية](/ar/concepts/architecture-overview/) لفهم التصميم المعماري
- استكشاف مرجع API للحزم المتاحة في قسم المرجع
