# 🧩 Tempot Business Modules (`modules/`)

> Self-contained, event-driven business modules providing core capabilities and extensions for Telegram bots.

---

## 📋 Architecture & Standards

All business functionality in Tempot is built as isolated workspace packages under `modules/`. Each module is completely decoupled from other modules and communicates exclusively via the **Event Bus** or through shared infrastructure packages.

### Standard Module Directory Layout

```
modules/{module-name}/
├── module.manifest.ts    # Static metadata, capabilities, commands & event contracts
├── module.config.ts      # Runtime configuration (navigation buttons, roles, features)
├── package.json          # Workspace package definition
├── tsconfig.json         # TypeScript configuration
├── src/
│   ├── index.ts          # Module export barrel
│   ├── commands/         # Telegram bot command handlers
│   ├── handlers/         # Message and callback handlers
│   ├── services/         # Business logic services
│   ├── repositories/     # Database access repositories (if applicable)
│   ├── menus/            # Inline keyboard menus (optional)
│   ├── features/         # Feature aggregators
│   ├── contracts/        # Types, interfaces & event schemas
│   └── locales/
│       ├── ar.json       # Arabic translations (primary)
│       └── en.json       # English translations
└── __tests__/            # Unit and integration test suites
```

---

## 📦 Available Modules Directory

| # | Module | Category | Primary Commands | Description | Documentation |
|---|---|---|---|---|---|
| 1 | 👤 **`user-management`** | Core Platform | `/start`, `/profile`, `/users` | User onboarding, RBAC permissions, and national ID parsing | [Read Docs](./user-management/README.md) |
| 2 | 🛡️ **`audit-viewer`** | Operational | `/stats` | Security audit trails and operational metrics inspection | [Read Docs](./audit-viewer/README.md) |
| 3 | 💾 **`backup-management`** | Operations | `/backups` | Database dump/restore, S3 export, and retention policies | [Read Docs](./backup-management/README.md) |
| 4 | 🤖 **`bot-management`** | Product | `/bots`, `/new_bot` | Multi-bot instance governance and provisioning lifecycle | [Read Docs](./bot-management/README.md) |
| 5 | 📝 **`content-management`** | Product | `/messages` | Dynamic CMS, message broadcasting, and interactive FAQs | [Read Docs](./content-management/README.md) |
| 6 | ❓ **`help-center`** | Core Platform | `/help` | Interactive command discovery and AI-assisted answering | [Read Docs](./help-center/README.md) |
| 7 | 🧠 **`knowledge-management`** | Operations | `/knowledge`, `/knowledge_custom` | RAG vector embeddings, pgvector store, and semantic search | [Read Docs](./knowledge-management/README.md) |
| 8 | 💳 **`membership-management`** | Core Platform | `/join` | Guest onboarding requests, tier tracking, and access gates | [Read Docs](./membership-management/README.md) |
| 9 | 🔔 **`notification-center`** | Operational | `/notifications` | User preference center and targeted batch alerts | [Read Docs](./notification-center/README.md) |
| 10 | ⚙️ **`settings-management`** | Core Platform | `/settings` | Language toggle (AR/EN), timezones, and number formats | [Read Docs](./settings-management/README.md) |
| 11 | 📋 **`template-management`** | Product | `/templates`, `/new_template` | Blueprint generation, import/export, and diagnostics | [Read Docs](./template-management/README.md) |

---

## 🛠️ CLI Scaffolding & Diagnostics

```bash
# Generate a new module from template
pnpm tempot module create <module-name>

# Validate an existing module against Tempot architecture rules
pnpm tempot module doctor <module-name>
```
