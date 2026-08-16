# 🤖 Bot Management Module (`modules/bot-management`)

> Multi-bot instance governance, provisioning lifecycle, operational health tracking, and configuration management for Tempot.

---

## 📋 Overview

The **`bot-management`** module provides comprehensive controls for administering and orchestrating multiple Telegram bot instances from a central administrative interface. It supports dynamic bot registration, webhook lifecycle management, feature toggling per bot instance, health probe tracking, and configuration import/export.

---

## 🛠️ Commands & Access Control

| Command | Description | Required Role | Access Classification | CASL Ability |
|---|---|---|---|---|
| `/bots` | List all registered bot instances and operational statuses | `SUPER_ADMIN` | `admin` | `manage.bots` |
| `/new_bot` | Provision and configure a new bot instance | `SUPER_ADMIN` | `admin` | `create.bot` |

---

## 📱 Navigation & UI/UX Surface

- **Main Menu Entry:**
  - **Button Label Key:** `bot-management.menu.button`
  - **Callback Query:** `bots:list`
  - **Layout:** Row 4, Order 10 (Admin section)
- **Interactive Workflows:**
  - **Instance Explorer:** View bot health, webhook latency, active user counts, and current uptime.
  - **Lifecycle Actions:** Start, pause, reload, or decommission bot runtime tokens.
  - **Module Enablement:** Toggle specific business modules on or off per bot instance.
  - **Import & Export:** Export complete bot configuration bundles to JSON/YAML.

---

## 📡 Event Contracts (Event Bus)

### Publishes
- `bot-management.bot.registered`: Emitted when a new bot token is verified and added.
- `bot-management.bot.updated`: Emitted on configuration or name changes.
- `bot-management.lifecycle.changed`: Emitted when a bot instance is started, stopped, or restarted.
- `bot-management.settings.changed`: Emitted when instance-level settings are updated.
- `bot-management.module-enablement.changed`: Emitted when modules are toggled.
- `bot-management.provisioning.completed`: Emitted after database schema and webhooks are initialized.
- `bot-management.health.changed`: Emitted when a health check status transitions (e.g. Healthy -> Degraded).
- `bot-management.export.completed`: Emitted when bot configuration export finishes.
- `bot-management.import.completed`: Emitted when bot configuration import finishes.

### Consumes
- *None (Originating lifecycle manager)*

---

## ⚙️ Module Configuration (`module.config.ts`)

```typescript
import type { ModuleConfig } from '@tempot/module-registry';

const config: ModuleConfig = {
  name: 'bot-management',
  version: '0.1.0',
  requiredRole: 'SUPER_ADMIN',
  isActive: true,
  isCore: false,
  commands: [
    { command: 'bots', description: 'bot-management.commands.bots' },
    { command: 'new_bot', description: 'bot-management.commands.new_bot' },
  ],
  navigation: {
    mainMenu: [
      {
        id: 'bot-management',
        labelKey: 'bot-management.menu.button',
        callbackData: 'bots:list',
        requiredRole: 'SUPER_ADMIN',
        accessClassification: 'admin',
        requiredAbility: 'manage.bots',
        row: 4,
        order: 10,
      },
    ],
  },
  features: {
    hasDatabase: true,
    hasNotifications: true,
    hasAttachments: false,
    hasExport: true,
    hasAI: false,
    hasInputEngine: true,
    hasImport: true,
    hasSearch: true,
    hasDynamicCMS: false,
    hasRegional: true,
  },
  requires: {
    packages: [
      '@tempot/database',
      '@tempot/auth-core',
      '@tempot/event-bus',
      '@tempot/notifier',
      '@tempot/input-engine',
    ],
    optional: ['@tempot/regional-engine', '@tempot/search-engine'],
  },
};

export default config;
```

---

## 🧩 Dependencies & Packages

| Package | Requirement | Purpose |
|---|---|---|
| `@tempot/database` | **Mandatory** | Bot instance entities, API token storage, and configuration tables |
| `@tempot/auth-core` | **Mandatory** | Strict Super Administrator authorization checks |
| `@tempot/event-bus` | **Mandatory** | Broadcasting instance lifecycle transitions across the cluster |
| `@tempot/notifier` | **Mandatory** | Dispatching alerts on bot downtime or health degradation |
| `@tempot/input-engine` | **Mandatory** | Multi-step interactive forms for registering new bot tokens |

---

## 🌐 Localization (I18n)

- **Translation Keys Prefix:** `bot-management.*`
- **Supported Locales:**
  - `locales/ar.json` — Arabic (Primary)
  - `locales/en.json` — English

---

## 🧪 Testing & Diagnostics

```bash
# Validate module structure and manifest contracts
pnpm tempot module doctor bot-management

# Run module test suites
pnpm --filter @tempot/bot-management test
```
