# ⚙️ Settings Management Module (`modules/settings-management`)

> User preferences, language selection, regional formatting, and bot configuration controls for Tempot.

---

## 📋 Overview

The **`settings-management`** module provides users and administrators with interactive preference management. It handles on-the-fly language switching (Arabic ⇄ English), timezone selection, regional numeral formatting preferences, and dynamic feature toggle settings.

---

## 🛠️ Commands & Access Control

| Command | Description | Required Role | Access Classification | CASL Ability |
|---|---|---|---|---|
| `/settings` | Open personal settings and preference menu | `USER` / `ADMIN` | `protected` | `read.settings` |

---

## 📱 Navigation & UI/UX Surface

- **Main Menu Entry:**
  - **Button Label Key:** `settings-management.menu.button`
  - **Callback Query:** `settings:view`
  - **Layout:** Row 0, Order 20 (Header quick-settings section)
- **Interactive Workflows:**
  - **Language Selector:** Instant toggle between Arabic (`ar`) and English (`en`) with immediate UI re-rendering.
  - **Timezone Picker:** Select preferred local timezone from standardized regional lists.
  - **Number & Currency Format:** Choose between Standard Western Arabic numerals (`1, 2, 3`) and Eastern Arabic-Indic numerals (`١, ٢, ٣`).

---

## 📡 Event Contracts (Event Bus)

- **Publishes:** *None (Settings changes are updated in session and settings storage directly)*
- **Consumes:** *None*

---

## ⚙️ Module Configuration (`module.config.ts`)

```typescript
import type { ModuleConfig } from '@tempot/module-registry';

const config: ModuleConfig = {
  name: 'settings-management',
  version: '0.1.0',
  requiredRole: 'USER',
  isActive: true,
  isCore: false,
  commands: [
    { command: 'settings', description: 'settings-management.commands.settings' },
  ],
  navigation: {
    mainMenu: [
      {
        id: 'settings',
        labelKey: 'settings-management.menu.button',
        callbackData: 'settings:view',
        requiredRole: 'USER',
        accessClassification: 'protected',
        requiredAbility: 'read.settings',
        row: 0,
        order: 20,
      },
    ],
  },
  features: {
    hasDatabase: false,
    hasNotifications: false,
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
    packages: ['@tempot/settings'],
    optional: ['@tempot/ux-helpers'],
  },
};

export default config;
```

---

## 🧩 Dependencies & Packages

| Package | Requirement | Purpose |
|---|---|---|
| `@tempot/settings` | **Mandatory** | Key-value settings storage engine and fallback resolver |
| `@tempot/ux-helpers` | Optional | Button builders and interactive setting menus |
| `@tempot/shared` | Mandatory | Bot context, Result types, and error handling |

---

## 🌐 Localization (I18n)

- **Translation Keys Prefix:** `settings-management.*`
- **Supported Locales:**
  - `locales/ar.json` — Arabic (Primary)
  - `locales/en.json` — English

---

## 🧪 Testing & Diagnostics

```bash
# Validate module structure and manifest contracts
pnpm tempot module doctor settings-management

# Run module test suites
pnpm --filter @tempot/settings-management test
```
