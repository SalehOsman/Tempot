# 🔔 Notification Center Module (`modules/notification-center`)

> Targeted broadcasting, user notification preference management, and batch alert dispatching for Tempot.

---

## 📋 Overview

The **`notification-center`** module manages personal user notification preferences and provides administrators with targeted broadcasting capabilities. It supports multi-channel notification queuing, user-level topic opt-ins/opt-outs, and batch delivery telemetry.

---

## 🛠️ Commands & Access Control

| Command | Description | Required Role | Access Classification | CASL Ability |
|---|---|---|---|---|
| `/notifications` | Open notification settings and preference center | `USER` / `ADMIN` | `protected` | `read.notifications` |

---

## 📱 Navigation & UI/UX Surface

- **Main Menu Entry:**
  - **Button Label Key:** `notification-center.menu.button`
  - **Callback Query:** `notifications:view`
  - **Layout:** Row 1, Order 10 (User section)
- **Interactive Workflows:**
  - **Preference Toggles:** Enable or disable specific notification categories (Announcements, Security, Reminders).
  - **Quiet Hours:** Set daily silence intervals to prevent notifications during specific hours.
  - **Broadcast Dispatcher (Admins):** Compose and preview broadcast messages to all users or specific segments with live delivery progress counters.

---

## 📡 Event Contracts (Event Bus)

### Publishes
- `notification-center.notification.test_requested`: Triggered when an operator tests notification dispatching.

### Consumes
- `bot-management.lifecycle.changed`: Automatically alerts subscribers on important bot status transitions.
- Subscribes to cross-module broadcast requests.

---

## ⚙️ Module Configuration (`module.config.ts`)

```typescript
import type { ModuleConfig } from '@tempot/module-registry';

const config: ModuleConfig = {
  name: 'notification-center',
  version: '0.1.0',
  requiredRole: 'USER',
  isActive: true,
  isCore: false,
  commands: [
    { command: 'notifications', description: 'notification-center.commands.notifications' },
  ],
  navigation: {
    mainMenu: [
      {
        id: 'notifications',
        labelKey: 'notification-center.menu.button',
        callbackData: 'notifications:view',
        requiredRole: 'USER',
        accessClassification: 'protected',
        requiredAbility: 'read.notifications',
        row: 1,
        order: 10,
      },
    ],
  },
  features: {
    hasDatabase: false,
    hasNotifications: true,
    hasAttachments: false,
    hasExport: false,
    hasAI: false,
    hasInputEngine: false,
    hasImport: false,
    hasSearch: false,
    hasDynamicCMS: false,
    hasRegional: false,
  },
  requires: {
    packages: ['@tempot/notifier'],
    optional: ['@tempot/settings'],
  },
};

export default config;
```

---

## 🧩 Dependencies & Packages

| Package | Requirement | Purpose |
|---|---|---|
| `@tempot/notifier` | **Mandatory** | Queue-backed broadcast dispatcher and Telegram message sender |
| `@tempot/settings` | Optional | Storing persistent user-level notification preferences |
| `@tempot/shared` | Mandatory | Bot context, Result types, and error handling |

---

## 🌐 Localization (I18n)

- **Translation Keys Prefix:** `notification-center.*`
- **Supported Locales:**
  - `locales/ar.json` — Arabic (Primary)
  - `locales/en.json` — English

---

## 🧪 Testing & Diagnostics

```bash
# Validate module structure and manifest contracts
pnpm tempot module doctor notification-center

# Run module test suites
pnpm --filter @tempot/notification-center test
```
