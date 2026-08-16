# 💳 Membership Management Module (`modules/membership-management`)

> Membership tier tracking, access request workflows, VIP expiration handling, and gated access controls for Tempot.

---

## 📋 Overview

The **`membership-management`** module governs onboarding workflows for guest users requesting bot membership, subscription tier assignments, automated expiration tracking, and administrative review of pending membership applications.

---

## 🛠️ Commands & Access Control

| Command | Description | Required Role | Access Classification | CASL Ability |
|---|---|---|---|---|
| `/join` | Submit a membership or tier upgrade request | `GUEST` / `USER` | `public` | `create.membership-request` |

---

## 📱 Navigation & UI/UX Surface

- **Main Menu Entry (Administrators):**
  - **Button Label Key:** `membership-management.menu.button`
  - **Callback Query:** `membership:list`
  - **Layout:** Row 2, Order 10 (Admin section)
- **User Workflows:**
  - **Membership Application:** Interactive questionnaire collecting user details and preferred tier.
  - **Application Status:** Real-time checking of request review status (`PENDING`, `APPROVED`, `REJECTED`).
- **Admin Review Workflows:**
  - **Pending Applications Queue:** Inline keyboard list of new user requests with one-click Approve / Reject buttons.
  - **Tier Assignment:** Dynamically adjust expiration dates and VIP permissions.

---

## 📡 Event Contracts (Event Bus)

### Publishes
- `membership-management.request.submitted`: Emitted when a user completes a membership application.
- `membership-management.request.approved`: Emitted when an admin approves a membership request (promotes role).
- `membership-management.request.rejected`: Emitted when an admin rejects a request with an optional reason.

### Consumes
- *None (Originating workflow)*

---

## ⚙️ Module Configuration (`module.config.ts`)

```typescript
import type { ModuleConfig } from '@tempot/module-registry';

const config: ModuleConfig = {
  name: 'membership-management',
  version: '0.1.0',
  requiredRole: 'GUEST',
  isActive: true,
  isCore: false,
  commands: [
    { command: 'join', description: 'membership-management.commands.join' },
  ],
  navigation: {
    mainMenu: [
      {
        id: 'membership-management',
        labelKey: 'membership-management.menu.button',
        callbackData: 'membership:list',
        requiredRole: 'ADMIN',
        accessClassification: 'admin',
        requiredAbility: 'manage.membership-request',
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
    hasAI: false,
    hasInputEngine: false,
    hasImport: false,
    hasSearch: false,
    hasDynamicCMS: false,
    hasRegional: false,
  },
  requires: {
    packages: ['@tempot/shared'],
    optional: [],
  },
};

export default config;
```

---

## 🧩 Dependencies & Packages

| Package | Requirement | Purpose |
|---|---|---|
| `@tempot/shared` | **Mandatory** | Application error classes, Result patterns, and context definitions |
| `@tempot/database` | Mandatory | Membership entity persistence and request status tracking |
| `@tempot/event-bus` | Mandatory | Publishing approval/rejection events for inter-module action |

---

## 🌐 Localization (I18n)

- **Translation Keys Prefix:** `membership-management.*`
- **Supported Locales:**
  - `locales/ar.json` — Arabic (Primary)
  - `locales/en.json` — English

---

## 🧪 Testing & Diagnostics

```bash
# Validate module structure and manifest contracts
pnpm tempot module doctor membership-management

# Run module test suites
pnpm --filter @tempot/membership-management test
```
