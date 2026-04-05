---
title: إنشاء وحدة جديدة
description: دليل عملي لإنشاء وحدة أعمال جديدة في منصة تمبوت مع الالتزام بالبنية المعمارية المطلوبة
tags:
  - guide
  - module
  - module-registry
audience:
  - bot-developer
  - package-developer
contentType: developer-docs
difficulty: intermediate
---

## نظرة عامة

الوحدات (Modules) هي الوحدات الوظيفية الأساسية في تمبوت. كل وحدة مستقلة تمامًا وتحتوي على منطق الأعمال والصلاحيات والترجمات الخاصة بها.

## بنية الوحدة المطلوبة

كل وحدة يجب أن تتبع هذه البنية:

```
modules/{module-name}/
├── index.ts              # نقطة الدخول: تسجيل الوحدة
├── module.config.ts      # إعدادات الوحدة (22 حقلًا إلزاميًا)
├── abilities.ts          # تعريف صلاحيات CASL
├── features/             # الميزات الفرعية
│   └── {feature-name}/
│       ├── {name}.handler.ts      # معالج الأوامر (إلزامي)
│       ├── {name}.service.ts      # منطق الأعمال (إلزامي)
│       ├── {name}.conversation.ts # تدفق المحادثة (اختياري)
│       └── {name}.test.ts         # الاختبارات
├── shared/               # مستودعات وأنواع مشتركة
├── locales/
│   ├── ar.json           # الترجمة العربية (أساسية)
│   └── en.json           # الترجمة الإنجليزية
├── database/             # (إذا كان hasDatabase = true)
│   ├── schema.prisma
│   └── migrations/
└── tests/                # اختبارات الوحدة
```

## إعداد ملف الإعدادات

أنشئ ملف `module.config.ts` بالبنية التالية:

```typescript
import type { ModuleConfig } from '@tempot/module-registry';

export const config: ModuleConfig = {
  name: 'my-module',
  version: '1.0.0',
  requiredRole: 'USER',
  commands: [{ command: 'mycommand', description: 'وصف الأمر' }],
  features: {
    hasDatabase: false,
    hasAI: false,
    hasSearch: false,
    hasNotifications: false,
    hasAttachments: false,
    hasInputEngine: false,
    hasImport: false,
    hasDynamicCMS: false,
    hasRegional: false,
    hasPayment: false,
  },
  isActive: true,
  isCore: false,
  requires: {
    packages: ['shared', 'logger'],
    optional: [],
  },
};
```

## تعريف الصلاحيات

في ملف `abilities.ts`، حدد صلاحيات CASL للوحدة:

```typescript
import { AbilityBuilder } from '@casl/ability';
import type { AppAbility } from '@tempot/auth-core';

export function defineAbilities(builder: AbilityBuilder<AppAbility>, role: string): void {
  if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
    builder.can('manage', 'MyModule');
  }
  if (role === 'USER') {
    builder.can('read', 'MyModule');
  }
}
```

## إنشاء ميزة فرعية

### المعالج (Handler)

```typescript
import type { BotContext } from '@tempot/shared';

export function registerHandlers(bot: BotContext): void {
  bot.command('mycommand', async (ctx) => {
    // منطق معالجة الأمر
  });
}
```

### الخدمة (Service)

```typescript
import { ok, err, type Result } from 'neverthrow';
import { AppError } from '@tempot/shared';

export function processData(input: string): Result<string, AppError> {
  if (!input) {
    return err(AppError.validation('Input is required'));
  }
  return ok(`Processed: ${input}`);
}
```

## إضافة الترجمات

### `locales/ar.json`

```json
{
  "myModule": {
    "welcome": "مرحبًا بك في الوحدة",
    "error": "حدث خطأ، حاول مرة أخرى"
  }
}
```

### `locales/en.json`

```json
{
  "myModule": {
    "welcome": "Welcome to the module",
    "error": "An error occurred, please try again"
  }
}
```

## دورة حياة الوحدة

يمر تسجيل الوحدة بثلاث مراحل:

1. **الاكتشاف** — يفحص `ModuleDiscovery` مجلد الوحدات ويحمّل إعدادات كل وحدة
2. **التحقق** — يتحقق `ModuleValidator` من البنية والصلاحيات والتبعيات
3. **التسجيل** — يسجل `ModuleRegistry` الأوامر مع Telegram API

الوحدات الأساسية (`isCore: true`) التي تفشل في التحقق توقف التطبيق بالكامل. الوحدات الاختيارية تُتخطى مع تحذير.

## أفضل الممارسات

- استخدم نمط `Result<T, AppError>` لجميع الدوال العامة بدلًا من رمي الاستثناءات
- اعتمد على ناقل الأحداث (Event Bus) للتواصل بين الوحدات
- اكتب الاختبارات أولًا (TDD): اختبار فاشل → كود يمرر → تحسين
- لا تستخدم نصوصًا ثابتة — استخدم نظام الترجمة (i18n) دائمًا
