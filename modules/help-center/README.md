# ❓ Help Center Module (`modules/help-center`)

> Interactive end-user support menus, command discovery, AI-assisted question answering, and guided help flows for Tempot.

---

## 📋 Overview

The **`help-center`** module provides users with an intuitive, self-service help environment. It automatically discovers all active bot commands and module capabilities, renders structured interactive navigation menus, and integrates graceful fallback AI answering for unstructured user questions.

---

## 🛠️ Commands & Access Control

| Command | Description | Required Role | Access Classification | CASL Ability |
|---|---|---|---|---|
| `/help` | Open the interactive help center and feature directory | `GUEST` / `USER` | `public` / `protected` | `read.help` |

---

## 📱 Navigation & UI/UX Surface

- **Main Menu Entry:**
  - **Button Label Key:** `help-center.menu.button`
  - **Callback Query:** `help:view`
  - **Layout:** Row 3, Order 10 (User navigation section)
- **Interactive Features:**
  - **Command Catalog:** Dynamic listing of commands available to the requesting user's specific role.
  - **Feature Guides:** Interactive step-by-step walkthroughs for core bot operations.
  - **AI Assistant Fallback:** When `hasAI: true` is enabled, user queries not matched by static FAQs are answered using context-grounded AI models.
  - **Operator Contact:** Direct action button to connect users with human support administrators.

---

## 📡 Event Contracts (Event Bus)

- **Publishes:** *None (Stateless user navigation module)*
- **Consumes:** *None*

---

## ⚙️ Module Configuration (`module.config.ts`)

```typescript
import type { ModuleConfig } from '@tempot/module-registry';

const config: ModuleConfig = {
  name: 'help-center',
  version: '0.1.0',
  requiredRole: 'USER',
  isActive: true,
  isCore: false,
  commands: [
    { command: 'help', description: 'help-center.commands.help' },
  ],
  navigation: {
    mainMenu: [
      {
        id: 'help-center',
        labelKey: 'help-center.menu.button',
        callbackData: 'help:view',
        requiredRole: 'USER',
        accessClassification: 'protected',
        requiredAbility: 'read.help',
        row: 3,
        order: 10,
      },
    ],
  },
  features: {
    hasDatabase: false,
    hasNotifications: false,
    hasAttachments: false,
    hasExport: false,
    hasAI: true,
    hasInputEngine: false,
    hasImport: false,
    hasSearch: false,
    hasDynamicCMS: false,
    hasRegional: false,
  },
  aiDegradationMode: 'graceful',
  requires: {
    packages: ['@tempot/i18n-core', '@tempot/ai-core'],
    optional: ['@tempot/search-engine'],
  },
};

export default config;
```

---

## 🧩 Dependencies & Packages

| Package | Requirement | Purpose |
|---|---|---|
| `@tempot/i18n-core` | **Mandatory** | Localized help strings and button labels |
| `@tempot/ai-core` | **Mandatory** | Natural language assistance and conversational answering |
| `@tempot/search-engine` | Optional | Instant semantic indexing over help topics |
| `@tempot/shared` | Mandatory | Bot context, Result types, and error handling |

---

## 🌐 Localization (I18n)

- **Translation Keys Prefix:** `help-center.*`
- **Supported Locales:**
  - `locales/ar.json` — Arabic (Primary)
  - `locales/en.json` — English

---

## 🧪 Testing & Diagnostics

```bash
# Validate module structure and manifest contracts
pnpm tempot module doctor help-center

# Run module test suites
pnpm --filter @tempot/help-center test
```
