# 🧠 Knowledge Management Module (`modules/knowledge-management`)

> RAG vector knowledgebase orchestration, document embeddings ingestion, and semantic search administration for Tempot.

---

## 📋 Overview

The **`knowledge-management`** module provides full administrative oversight and execution tools for the platform's Retrieval-Augmented Generation (RAG) vector store. Super Administrators can trigger document embedding ingestion, monitor vector database synchronization, inspect vector index metrics, and execute test semantic queries directly through Telegram.

---

## 🛠️ Commands & Access Control

| Command | Description | Required Role | Access Classification | CASL Ability |
|---|---|---|---|---|
| `/knowledge` | Open the vector knowledgebase and RAG operations panel | `SUPER_ADMIN` | `admin` | `manage.knowledge` |
| `/knowledge_custom` | Execute custom vector queries and test similarity thresholds | `SUPER_ADMIN` | `admin` | `manage.knowledge` |

---

## 📱 Navigation & UI/UX Surface

- **Main Menu Entry:**
  - **Button Label Key:** `knowledge-management.menu.button`
  - **Callback Query:** `knowledge:view`
  - **Layout:** Row 5, Order 50 (Super Admin section)
- **Interactive Operations:**
  - **RAG Status:** View total indexed documents, embedding dimensions, vector store latency, and model metadata.
  - **Dry-run Ingestion:** Preview document chunking and token consumption without modifying the vector store.
  - **Execute Ingestion:** Compute embeddings via Vercel AI SDK and write vectors to PostgreSQL `pgvector`.
  - **Full Re-indexing:** Re-chunk and regenerate embeddings for the entire documentation corpus.
  - **Semantic Query Tester:** Test cosine similarity search against live documentation chunks with score breakdowns.

---

## 📡 Event Contracts (Event Bus)

### Publishes
- `knowledge.ingestion.dry_run_requested`: Triggered when previewing document chunking.
- `knowledge.ingestion.write_requested`: Triggered when writing embeddings to pgvector.
- `knowledge.ingestion.full_reindex_requested`: Triggered when forcing a complete knowledgebase rebuild.

### Consumes
- *None (Originating RAG orchestrator)*

---

## ⚙️ Module Configuration (`module.config.ts`)

```typescript
import type { ModuleConfig } from '@tempot/module-registry';

const config: ModuleConfig = {
  name: 'knowledge-management',
  version: '0.1.0',
  requiredRole: 'SUPER_ADMIN',
  isActive: true,
  isCore: false,
  commands: [
    { command: 'knowledge', description: 'knowledge-management.commands.knowledge' },
    {
      command: 'knowledge_custom',
      description: 'knowledge-management.commands.knowledge_custom',
    },
  ],
  navigation: {
    mainMenu: [
      {
        id: 'knowledge-management',
        labelKey: 'knowledge-management.menu.button',
        callbackData: 'knowledge:view',
        requiredRole: 'SUPER_ADMIN',
        accessClassification: 'admin',
        requiredAbility: 'manage.knowledge',
        row: 5,
        order: 50,
      },
    ],
  },
  features: {
    hasDatabase: true,
    hasNotifications: false,
    hasAttachments: false,
    hasExport: false,
    hasAI: true,
    hasInputEngine: false,
    hasImport: false,
    hasSearch: true,
    hasDynamicCMS: false,
    hasRegional: false,
  },
  aiDegradationMode: 'graceful',
  requires: {
    packages: ['@tempot/ai-core', '@tempot/ux-helpers'],
    optional: ['@tempot/event-bus'],
  },
};

export default config;
```

---

## 🧩 Dependencies & Packages

| Package | Requirement | Purpose |
|---|---|---|
| `@tempot/ai-core` | **Mandatory** | Text embedding generation, vector distance calculations, and LLM queries |
| `@tempot/ux-helpers` | **Mandatory** | Keyboard builders and status message formatters |
| `@tempot/database` | Mandatory | PostgreSQL 16 + `pgvector` extension schema and queries |
| `@tempot/event-bus` | Optional | Async queue job notifications for long-running batch ingestion |

---

## 🌐 Localization (I18n)

- **Translation Keys Prefix:** `knowledge-management.*`
- **Supported Locales:**
  - `locales/ar.json` — Arabic (Primary)
  - `locales/en.json` — English

---

## 🧪 Testing & Diagnostics

```bash
# Validate module structure and manifest contracts
pnpm tempot module doctor knowledge-management

# Run module test suites
pnpm --filter @tempot/knowledge-management test
```
