# 📋 Template Management Module (`modules/template-management`)

> Bot blueprint scaffolding, module template validation, template importing/exporting, and diagnostic workflows for Tempot.

---

## 📋 Overview

The **`template-management`** module manages bot blueprint templates and module scaffolding inside Tempot. It allows developers and administrators to create, validate, publish, export, import, and clone bot blueprints with full database schema, CMS defaults, and navigation bindings.

---

## 🛠️ Commands & Access Control

| Command | Description | Required Role | Access Classification | CASL Ability |
|---|---|---|---|---|
| `/templates` | List and browse available bot templates and blueprints | `GUEST` / `USER` | `public` | `read.templates` |
| `/new_template` | Create a new blueprint template interactively | `ADMIN` / `SUPER_ADMIN` | `admin` | `create.template` |
| `/import_template` | Import an external template definition file | `ADMIN` / `SUPER_ADMIN` | `admin` | `import.template` |

---

## 📱 Navigation & UI/UX Surface

- **Main Menu Entry:**
  - **Button Label Key:** `template-management.menu.button`
  - **Callback Query:** `templates:list`
  - **Layout:** Row 3, Order 30 (Template explorer)
- **Interactive Workflows:**
  - **Template Marketplace / Gallery:** Browse curated bot templates with live previews, feature matrices, and rating reviews.
  - **Blueprint Builder:** Interactive form wizard powered by `@tempot/input-engine` to customize template features.
  - **Template Import/Export:** Package blueprints into portable JSON/YAML archives.

---

## 📡 Event Contracts (Event Bus)

### Publishes
- `template-management.template.created`: Emitted when a new template blueprint is created.
- `template-management.status.changed`: Emitted when a template status changes (`DRAFT`, `PUBLISHED`, `ARCHIVED`).
- `template-management.version.published`: Emitted when a new blueprint version is released.
- `template-management.template.deleted`: Emitted when a template is soft-deleted.
- `template-management.template.cloned`: Emitted when an existing template is cloned.
- `template-management.template.rated`: Emitted when a user submits a rating for a template.

### Consumes
- *None (Originating workflow)*

---

## ⚙️ Module Configuration (`module.config.ts`)

```typescript
import type { ModuleConfig } from '@tempot/module-registry';

const config: ModuleConfig = {
  name: 'template-management',
  version: '0.1.0',
  requiredRole: 'GUEST',
  isActive: true,
  isCore: false,
  commands: [
    { command: 'templates', description: 'template-management.commands.templates' },
    { command: 'new_template', description: 'template-management.commands.new_template' },
    { command: 'import_template', description: 'template-management.commands.import_template' },
  ],
  features: {
    hasDatabase: true,
    hasNotifications: true,
    hasAttachments: false,
    hasExport: true,
    hasImport: true,
    hasAI: false,
    hasInputEngine: true,
    hasSearch: true,
    hasDynamicCMS: true,
    hasRegional: true,
  },
  requires: {
    packages: [
      '@tempot/database',
      '@tempot/auth-core',
      '@tempot/event-bus',
      '@tempot/search-engine',
      '@tempot/import-engine',
      '@tempot/document-engine',
      '@tempot/notifier',
      '@tempot/cms-engine',
    ],
    optional: ['@tempot/input-engine', '@tempot/regional-engine'],
  },
};

export default config;
```

---

## 🧩 Dependencies & Packages

| Package | Requirement | Purpose |
|---|---|---|
| `@tempot/database` | **Mandatory** | Template entities, blueprint versions, and rating tables |
| `@tempot/auth-core` | **Mandatory** | RBAC permissions for template creation and publishing |
| `@tempot/event-bus` | **Mandatory** | Publishing blueprint lifecycle events |
| `@tempot/search-engine` | **Mandatory** | Full-text search across template catalog |
| `@tempot/import-engine` | **Mandatory** | Importing structured template bundles |
| `@tempot/document-engine` | **Mandatory** | Exporting and generating blueprint specifications |
| `@tempot/cms-engine` | **Mandatory** | Content definitions associated with blueprints |
| `@tempot/notifier` | **Mandatory** | Notifying subscribers of new template releases |

---

## 🌐 Localization (I18n)

- **Translation Keys Prefix:** `template-management.*`
- **Supported Locales:**
  - `locales/ar.json` — Arabic (Primary)
  - `locales/en.json` — English

---

## 🧪 Testing & Diagnostics

```bash
# Validate module structure and manifest contracts
pnpm tempot module doctor template-management

# Run module test suites
pnpm --filter @tempot/template-management test
```
