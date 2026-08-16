# 🛡️ Audit Viewer Module (`modules/audit-viewer`)

> Operational audit trail inspection, metrics visualization, and administrative activity logging for Tempot.

---

## 📋 Overview

The **`audit-viewer`** module provides administrators and security operators with direct Telegram-based visibility into system operations, security events, user activity, and platform metrics. It aggregates audit logs generated across all business modules into clean, paginated, inline-keyboard inspection views.

---

## 🛠️ Commands & Access Control

| Command | Description | Required Role | Access Classification | CASL Ability |
|---|---|---|---|---|
| `/stats` | View operational statistics, event metrics, and system activity logs | `ADMIN` / `SUPER_ADMIN` | `admin` | `read.stats` |

---

## 📱 Navigation & UI/UX Surface

- **Main Menu Entry:**
  - **Button Label Key:** `audit-viewer.menu.button`
  - **Callback Query:** `audit:view`
  - **Layout:** Row 4, Order 40 (Admin navigation section)
- **Interactive Views:**
  - **Daily Activity Summary:** User registrations, active sessions, message throughput.
  - **Security Event Logs:** Failed logins, authorization denials, administrative role changes.
  - **Module Health Metrics:** Execution latencies, queue job throughput, and error rates.

---

## 📡 Event Contracts (Event Bus)

- **Publishes:** *None (Consumer/Viewer module)*
- **Consumes:** Subscribes to system audit trails and security event streams.

---

## ⚙️ Module Configuration (`module.config.ts`)

```typescript
import type { ModuleConfig } from '@tempot/module-registry';

const config: ModuleConfig = {
  name: 'audit-viewer',
  version: '0.1.0',
  requiredRole: 'ADMIN',
  isActive: true,
  isCore: false,
  commands: [
    { command: 'stats', description: 'audit-viewer.commands.stats' },
  ],
  navigation: {
    mainMenu: [
      {
        id: 'audit-viewer',
        labelKey: 'audit-viewer.menu.button',
        callbackData: 'audit:view',
        requiredRole: 'ADMIN',
        accessClassification: 'admin',
        requiredAbility: 'read.stats',
        row: 4,
        order: 40,
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
    packages: ['@tempot/interaction-observability'],
    optional: ['@tempot/event-bus'],
  },
};

export default config;
```

---

## 🧩 Dependencies & Packages

| Package | Requirement | Purpose |
|---|---|---|
| `@tempot/interaction-observability` | **Mandatory** | Metric collection, latency tracking, and event aggregation |
| `@tempot/event-bus` | Optional | Listening to cross-module operational events |
| `@tempot/database` | Mandatory | Querying persistent audit logs and user activity tables |
| `@tempot/shared` | Mandatory | Result types, error handling, and bot context |

---

## 🌐 Localization (I18n)

- **Translation Keys Prefix:** `audit-viewer.*`
- **Supported Locales:**
  - `locales/ar.json` — Arabic (Primary)
  - `locales/en.json` — English

---

## 🧪 Testing & Diagnostics

```bash
# Validate module structure and manifest contracts
pnpm tempot module doctor audit-viewer

# Run module test suites
pnpm --filter @tempot/audit-viewer test
```
