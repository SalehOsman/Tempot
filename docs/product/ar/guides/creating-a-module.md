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

تتبع كل وحدة في تمبوت بنية قياسية موحدة:

```
modules/{module-name}/
├── module.manifest.ts    # البيانات الوصفية والإمكانيات وعقود الأحداث
├── module.config.ts      # إعدادات التشغيل (التنقل، الأدوار، الميزات)
├── package.json          # تعريف حزمة مساحة العمل
├── tsconfig.json         # إعدادات TypeScript
├── src/
│   ├── index.ts          # نقطة الدخول وتصدير الوحدة
│   ├── commands/         # معالجات أوامر تيليجرام
│   ├── handlers/         # معالجات الرسائل والـ callbacks
│   ├── services/         # خدمات منطق الأعمال
│   ├── repositories/     # مستودعات الوصول لقاعدة البيانات (إن وجدت)
│   ├── menus/            # القوائم والأزرار الشفافة (اختياري)
│   ├── features/         # مجمعات الميزات
│   ├── contracts/        # الأنواع والواجهات ومخططات الأحداث
│   └── locales/
│       ├── ar.json       # الترجمة العربية (الأساسية)
│       └── en.json       # الترجمة الإنجليزية
└── __tests__/            # حزم الاختبارات الوظيفية والتكاملية
```

## 1. بيان الوحدة (`module.manifest.ts`)

حدد البيانات الوصفية الثابتة والإمكانيات وعقود الأحداث:

```typescript
export const moduleManifest = {
  name: 'my-module',
  type: 'business',
  blueprint: 'basic',
  status: 'active',
  capabilities: ['my-feature'] as const,
  commands: ['mycommand'] as const,
  events: {
    publishes: ['my-module.item.created'] as const,
    consumes: [] as const,
  },
} as const;

export type ModuleManifest = typeof moduleManifest;
```

## 2. إعدادات التشغيل للوحدة (`module.config.ts`)

أنشئ ملف `module.config.ts` لتصدير تكوين التشغيل:

```typescript
import type { ModuleConfig } from '@tempot/module-registry';

const config: ModuleConfig = {
  name: 'my-module',
  version: '1.0.0',
  requiredRole: 'USER',
  isActive: true,
  isCore: false,

  commands: [
    { command: 'mycommand', description: 'my-module.commands.mycommand' },
  ],

  navigation: {
    mainMenu: [
      {
        id: 'my-feature',
        labelKey: 'my-module.menu.button.title',
        callbackData: 'my-module:view',
        requiredRole: 'USER',
        accessClassification: 'protected',
        requiredAbility: 'read.my-feature',
        row: 1,
        order: 10,
      },
    ],
  },

  features: {
    hasDatabase: false,
    hasNotifications: false,
    hasAttachments: false,
    hasExport: false,
    hasImport: false,
    hasAI: false,
    hasInputEngine: false,
    hasSearch: false,
    hasDynamicCMS: false,
    hasRegional: false,
  },

  requires: {
    packages: ['@tempot/shared', '@tempot/logger'],
    optional: [],
  },
};

export default config;
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
