# 📝 Content Management Module (`modules/content-management`)

> Dynamic bot content management, broadcast templates, rich message formatting, and interactive FAQs for Tempot.

---

## 📋 Overview

The **`content-management`** module gives bot operators and content managers the ability to dynamically update bot welcome messages, help texts, announcement banners, broadcast templates, and FAQ trees directly through Telegram without requiring code deploys or application restarts.

---

## 🛠️ Commands & Access Control

| Command | Description | Required Role | Access Classification | CASL Ability |
|---|---|---|---|---|
| `/messages` | Open the content management and message editor dashboard | `ADMIN` / `SUPER_ADMIN` | `admin` | `manage.content` |

---

## 📱 Navigation & UI/UX Surface

- **Main Menu Entry:**
  - **Button Label Key:** `content-management.menu.button`
  - **Callback Query:** `content:list`
  - **Layout:** Row 3, Order 10 (Content Administrator section)
- **Interactive Workflows:**
  - **Message Editor:** Live inline editing of markdown/HTML formatted messages.
  - **Media Attachments:** Upload and associate photos, documents, and videos with bot content blocks.
  - **Broadcast Drafts:** Compose, preview, and schedule broadcast messages to user segments.
  - **FAQ Builder:** Hierarchical question-and-answer trees with instant inline keyboard navigation.

---

## 📡 Event Contracts (Event Bus)

- **Publishes:** *None (CMS content updates are consumed locally via database repository cache)*
- **Consumes:** Subscribes to content invalidation events to refresh runtime caches.

---

## ⚙️ Module Configuration (`module.config.ts`)

```typescript
import type { ModuleConfig } from '@tempot/module-registry';

const config: ModuleConfig = {
  name: 'content-management',
  version: '0.1.0',
  requiredRole: 'ADMIN',
  isActive: true,
  isCore: false,
  commands: [
    { command: 'messages', description: 'content-management.commands.messages' },
  ],
  navigation: {
    mainMenu: [
      {
        id: 'content-management',
        labelKey: 'content-management.menu.button',
        callbackData: 'content:list',
        requiredRole: 'ADMIN',
        accessClassification: 'admin',
        requiredAbility: 'manage.content',
        row: 3,
        order: 10,
      },
    ],
  },
  features: {
    hasDatabase: true,
    hasNotifications: true,
    hasAttachments: true,
    hasExport: false,
    hasAI: false,
    hasInputEngine: true,
    hasImport: false,
    hasSearch: true,
    hasDynamicCMS: true,
    hasRegional: false,
  },
  requires: {
    packages: [
      '@tempot/database',
      '@tempot/cms-engine',
      '@tempot/input-engine',
      '@tempot/ux-helpers',
    ],
    optional: ['@tempot/storage-engine', '@tempot/search-engine'],
  },
};

export default config;
```

---

## 🧩 Dependencies & Packages

| Package | Requirement | Purpose |
|---|---|---|
| `@tempot/database` | **Mandatory** | Content storage, message versions, and FAQ nodes |
| `@tempot/cms-engine` | **Mandatory** | Dynamic key-value content resolution and fallback engine |
| `@tempot/input-engine` | **Mandatory** | Interactive forms for typing and editing content |
| `@tempot/ux-helpers` | **Mandatory** | Keyboard builders and message formatting previewers |
| `@tempot/storage-engine` | Optional | Storing attached media files in S3 or local storage |

---

## 🌐 Localization (I18n)

- **Translation Keys Prefix:** `content-management.*`
- **Supported Locales:**
  - `locales/ar.json` — Arabic (Primary)
  - `locales/en.json` — English

---

## 🧪 Testing & Diagnostics

```bash
# Validate module structure and manifest contracts
pnpm tempot module doctor content-management

# Run module test suites
pnpm --filter @tempot/content-management test
```
