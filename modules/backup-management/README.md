# 💾 Backup Management Module (`modules/backup-management`)

> Automated database dump/restore orchestration, retention lifecycle management, and restore rehearsals for Tempot.

---

## 📋 Overview

The **`backup-management`** module provides mission-critical disaster recovery and data retention capabilities for bot instances. It allows Super Administrators to trigger on-demand PostgreSQL database backups, inspect backup archives, execute non-destructive restore rehearsals against isolated rehearsal databases, and enforce automated retention pruning policies directly from Telegram.

---

## 🛠️ Commands & Access Control

| Command | Description | Required Role | Access Classification | CASL Ability |
|---|---|---|---|---|
| `/backups` | Open the backup management control panel | `SUPER_ADMIN` | `admin` | `manage.backups` |

---

## 📱 Navigation & UI/UX Surface

- **Main Menu Entry:**
  - **Button Label Key:** `backup-management.menu.button`
  - **Callback Query:** `backups:view`
  - **Layout:** Row 5, Order 10 (Protected Super Admin section)
- **Interactive Workflows:**
  - **Create Backup:** Triggers pg_dump export, compresses artifact, and uploads to S3/local storage.
  - **List Archives:** Paginated list of recent backups with sizes, checksums, and timestamps.
  - **Restore Rehearsal:** Validates backup integrity by executing a real restore against `tempot_restore_db` (Port 5433).
  - **Retention Enforcement:** Manually or automatically prunes archives older than `BACKUP_RETENTION_DAYS`.

---

## 📡 Event Contracts (Event Bus)

### Publishes
- `backup.job.requested`: Triggered when an operator starts a backup export.
- `restore.rehearsal.requested`: Triggered when testing backup integrity.
- `backup.retention.executed`: Emitted after cleaning up expired backup files.

### Consumes
- `backup.job.succeeded`: Updates UI status and notifies administrators.
- `backup.job.failed`: Generates critical alert and triggers error telemetry.
- `backup.job.warning`: Emitted when backup completed with non-fatal warnings.

---

## ⚙️ Module Configuration (`module.config.ts`)

```typescript
import type { ModuleConfig } from '@tempot/module-registry';

const config: ModuleConfig = {
  name: 'backup-management',
  version: '0.1.0',
  requiredRole: 'SUPER_ADMIN',
  isActive: true,
  isCore: false,
  commands: [
    { command: 'backups', description: 'backup-management.commands.backups' },
  ],
  navigation: {
    mainMenu: [
      {
        id: 'backup-management',
        labelKey: 'backup-management.menu.button',
        callbackData: 'backups:view',
        requiredRole: 'SUPER_ADMIN',
        accessClassification: 'admin',
        requiredAbility: 'manage.backups',
        row: 5,
        order: 10,
      },
    ],
  },
  features: {
    hasDatabase: true,
    hasNotifications: true,
    hasAttachments: true,
    hasExport: true,
    hasAI: false,
    hasInputEngine: false,
    hasImport: false,
    hasSearch: false,
    hasDynamicCMS: false,
    hasRegional: false,
  },
  requires: {
    packages: ['@tempot/backup-engine', '@tempot/notifier'],
    optional: ['@tempot/event-bus', '@tempot/storage-engine'],
  },
};

export default config;
```

---

## 🧩 Dependencies & Packages

| Package | Requirement | Purpose |
|---|---|---|
| `@tempot/backup-engine` | **Mandatory** | PostgreSQL dump, restore rehearsal, and encryption engine |
| `@tempot/notifier` | **Mandatory** | Operator alerts for backup completions and failures |
| `@tempot/event-bus` | Optional | Async queue job notifications and decoupled messaging |
| `@tempot/storage-engine` | Optional | Offsite cloud storage sync (AWS S3, MinIO) |

---

## 🌐 Localization (I18n)

- **Translation Keys Prefix:** `backup-management.*`
- **Supported Locales:**
  - `locales/ar.json` — Arabic (Primary)
  - `locales/en.json` — English

---

## 🧪 Testing & Diagnostics

```bash
# Validate module structure and manifest contracts
pnpm tempot module doctor backup-management

# Run module test suites
pnpm --filter @tempot/backup-management test
```
