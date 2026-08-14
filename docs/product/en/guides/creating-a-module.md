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

Every module must follow this structure:

```
modules/{module-name}/
├── index.ts              # Entry point: module registration
├── module.config.ts      # Module configuration (22 mandatory fields)
├── abilities.ts          # CASL permission definitions
├── features/             # Sub-features
│   └── {feature-name}/
│       ├── {name}.handler.ts      # Command handler (mandatory)
│       ├── {name}.service.ts      # Business logic (mandatory)
│       ├── {name}.conversation.ts # Conversation flow (optional)
│       └── {name}.test.ts         # Tests
├── shared/               # Shared repositories and types
├── locales/
│   ├── ar.json           # Arabic translations (primary)
│   └── en.json           # English translations
├── database/             # (if hasDatabase = true)
│   ├── schema.prisma
│   └── migrations/
└── tests/                # Module tests
```

## Setting Up the Configuration

Create a `module.config.ts` file:

```typescript
import type { ModuleConfig } from '@tempot/module-registry';

export const config: ModuleConfig = {
  name: 'my-module',
  version: '1.0.0',
  requiredRole: 'USER',
  commands: [{ command: 'mycommand', description: 'Command description' }],
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
