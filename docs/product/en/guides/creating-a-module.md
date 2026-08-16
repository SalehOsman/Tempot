---
title: Creating a Module
description: Practical guide to creating a new business module in Tempot following the required architecture
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

## Overview

Modules are the core functional units in Tempot. Each module is fully self-contained with its own business logic, permissions, and translations.

## Required Module Structure

Every module in Tempot follows a standardized layout:

```
modules/{module-name}/
├── module.manifest.ts    # Module metadata, capabilities, commands & event contracts
├── module.config.ts      # Runtime configuration (navigation, roles, features)
├── package.json          # Workspace package definition
├── tsconfig.json         # TypeScript configuration
├── src/
│   ├── index.ts          # Module export barrel
│   ├── commands/         # Telegram bot command handlers
│   ├── handlers/         # Message and callback handlers
│   ├── services/         # Business logic services
│   ├── repositories/     # Database access repositories (if applicable)
│   ├── menus/            # Inline keyboard menus (optional)
│   ├── features/         # Feature aggregators
│   ├── contracts/        # Types, interfaces & event schemas
│   └── locales/
│       ├── ar.json       # Arabic translations (primary)
│       └── en.json       # English translations
└── __tests__/            # Unit and integration test suites
```

## 1. Module Manifest (`module.manifest.ts`)

Declare static metadata, capabilities, and event contracts:

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

## 2. Module Runtime Configuration (`module.config.ts`)

Create a `module.config.ts` file exporting the runtime configuration:

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

## Defining Permissions

In `abilities.ts`, define CASL permissions for the module:

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

## Creating a Sub-Feature

### Handler

```typescript
import type { BotContext } from '@tempot/shared';

export function registerHandlers(bot: BotContext): void {
  bot.command('mycommand', async (ctx) => {
    // Command handling logic
  });
}
```

### Service

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

## Adding Translations

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

## Module Lifecycle

Module registration goes through three phases:

1. **Discovery** — `ModuleDiscovery` scans the modules directory and loads each module's configuration
2. **Validation** — `ModuleValidator` checks structure, permissions, and dependencies
3. **Registration** — `ModuleRegistry` registers commands with the Telegram Bot API

Core modules (`isCore: true`) that fail validation halt the entire application. Optional modules are skipped with a warning.

## Best Practices

- Use the `Result<T, AppError>` pattern for all public functions instead of throwing exceptions
- Rely on the Event Bus for inter-module communication
- Write tests first (TDD): failing test, passing code, then refactor
- Never use hardcoded strings — always use the i18n system
