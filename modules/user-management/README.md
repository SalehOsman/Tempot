# 👤 User Management Module (`modules/user-management`)

> Core user onboarding, profile lifecycle, RBAC administration, and regional identity parsing for Tempot.

---

## 📋 Overview

The **`user-management`** module serves as the primary user onboarding and identity foundation for Tempot. It provides button-first profile inspection and editing, administrator user management, CASL-based role assignment, national ID verification via `@tempot/national-id-parser`, and guest membership application integration.

---

## 🛠️ Commands & Access Control

| Command | Description | Required Role | Access Classification | CASL Ability |
|---|---|---|---|---|
| `/start` | Bot bootstrap entry point and main menu renderer | `GUEST` / `USER` | `public` | *Bootstrap* |
| `/profile` | View and edit personal user profile | `USER` | `protected` | `read.profile` |
| `/users` | Administrator user list, role controls, and search | `ADMIN` / `SUPER_ADMIN` | `admin` | `manage.users` |

---

## 📱 Navigation & UI/UX Surface

- **Main Menu Entries:**
  - **Profile Button:** `user-management.menu.button.profile` ➔ Callback `profile:view` (Row 0, Order 10)
  - **Users Button:** `user-management.menu.button.users` ➔ Callback `users:list` (Row 2, Order 10 - Admin Only)
- **Interactive Workflows:**
  - **Profile Editor:** Multi-step wizard to update display name, phone, national ID, and regional governorate.
  - **Admin User Directory:** Search users by username, Telegram ID, or phone number with real-time banning/unbanning.
  - **Role Management:** Elevate or demote roles (`USER` ⇄ `ADMIN`) with protection preventing demotion of the last active Super Admin.

---

## 📡 Event Contracts (Event Bus)

### Publishes
- `user-management.user.started`: Emitted when a user sends `/start` or registers for the first time.

### Consumes
- `membership-management.request.approved`: Automatically promotes user role from `GUEST` to `USER`.

---

## ⚙️ Module Configuration (`module.config.ts`)

```typescript
import type { ModuleConfig } from '@tempot/module-registry';

const config: ModuleConfig = {
  name: 'user-management',
  version: '1.0.0',
  requiredRole: 'USER',
  isActive: true,
  isCore: false,

  commands: [
    { command: 'start', description: 'user-management.commands.start' },
    { command: 'profile', description: 'user-management.commands.profile' },
    { command: 'users', description: 'user-management.commands.users' },
  ],

  navigation: {
    mainMenu: [
      {
        id: 'profile',
        labelKey: 'user-management.menu.button.profile',
        callbackData: 'profile:view',
        requiredRole: 'USER',
        accessClassification: 'protected',
        requiredAbility: 'read.profile',
        row: 0,
        order: 10,
      },
      {
        id: 'users',
        labelKey: 'user-management.menu.button.users',
        callbackData: 'users:list',
        requiredRole: 'ADMIN',
        accessClassification: 'admin',
        requiredAbility: 'manage.users',
        row: 2,
        order: 10,
      },
    ],
  },

  features: {
    hasDatabase: true,
    hasNotifications: false,
    hasAttachments: false,
    hasExport: false,
    hasImport: false,
    hasAI: false,
    hasInputEngine: false,
    hasSearch: false,
    hasDynamicCMS: false,
    hasRegional: true,
  },

  requires: {
    packages: ['@tempot/database', '@tempot/auth-core', '@tempot/national-id-parser'],
    optional: ['@tempot/input-engine', '@tempot/regional-engine'],
  },
};

export default config;
```

---

## 🧩 Dependencies & Packages

| Package | Requirement | Purpose |
|---|---|---|
| `@tempot/database` | **Mandatory** | User, UserProfile, and Role database tables |
| `@tempot/auth-core` | **Mandatory** | CASL RBAC rule evaluation and authorization guards |
| `@tempot/national-id-parser` | **Mandatory** | Validation and parsing of Egyptian National IDs (birth date, gender, governorate) |
| `@tempot/regional-engine` | Optional | Localized date and numeral formatting for profile details |
| `@tempot/input-engine` | Optional | Structured form fields for profile registration |

---

## 🌐 Localization (I18n)

- **Translation Keys Prefix:** `user-management.*`
- **Supported Locales:**
  - `locales/ar.json` — Arabic (Primary)
  - `locales/en.json` — English

---

## 🧪 Testing & Diagnostics

```bash
# Validate module structure and manifest contracts
pnpm tempot module doctor user-management

# Run module test suites
pnpm --filter @tempot/user-management test
```
