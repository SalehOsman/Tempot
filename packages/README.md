# 📦 Tempot Packages Directory (`packages/`)

> Enterprise-grade, modular, and typed infrastructure packages powering the Tempot Telegram bot framework.

---

## 📋 Overview

The `packages/` directory contains **23 decoupled workspace packages**. Each package is headless (pure TypeScript), strictly adheres to neverthrow Result patterns, maintains zero direct coupling to the Telegram UI layer, and can be consumed independently by bots, modules, and external applications.

---

## 🗂️ Packages Directory by Category

### 1. ⚙️ Core Infrastructure & Data
| Package | Description | Key Capabilities | Documentation |
|---|---|---|---|
| 🗄️ **`@tempot/database`** | PostgreSQL 16 & Prisma 7 data access | Dual-ORM (Prisma + Drizzle pgvector), BaseRepository, Soft-delete, AES-256 protected data | [Read Docs](./database/README.md) |
| 🔄 **`@tempot/shared`** | Foundational runtime contracts | `AppError` hierarchy, Result constructors, CacheService, QueueFactory, ShutdownManager | [Read Docs](./shared/README.md) |
| 📡 **`@tempot/event-bus`** | Decoupled inter-module communication | 3-level event propagation (`LOCAL`, `INTERNAL`, `EXTERNAL`), Redis Pub/Sub, ConnectionWatcher | [Read Docs](./event-bus/README.md) |
| 💾 **`@tempot/session-manager`** | Redis-backed user session store | State serialization, TTL expiration, interactive step management | [Read Docs](./session-manager/README.md) |
| ⚙️ **`@tempot/settings`** | Dynamic configuration store | Key-value settings engine, user preferences, fallback resolution | [Read Docs](./settings/README.md) |
| 🧩 **`@tempot/module-registry`** | Module lifecycle & manifest loader | Dynamic discovery, capability checking, command/event validation | [Read Docs](./module-registry/README.md) |

---

### 2. 🛡️ Identity, Security & Localization
| Package | Description | Key Capabilities | Documentation |
|---|---|---|---|
| 🛡️ **`@tempot/auth-core`** | CASL RBAC authorization engine | Role evaluation (`GUEST`, `USER`, `ADMIN`, `SUPER_ADMIN`), permission rules | [Read Docs](./auth-core/README.md) |
| 🌐 **`@tempot/i18n-core`** | Internationalization engine | Dual-language (`ar`/`en`) translation resolution, parameter interpolation | [Read Docs](./i18n-core/README.md) |
| 🌍 **`@tempot/regional-engine`** | Localized formatting & geo data | Eastern/Western Arabic numerals, currency formatting, governorate resolution | [Read Docs](./regional-engine/README.md) |
| 🆔 **`@tempot/national-id-parser`** | Identity validation engine | Egyptian National ID parsing (birth date, gender, governorate validation) | [Read Docs](./national-id-parser/README.md) |

---

### 3. 🧠 AI, Search & Content Engines
| Package | Description | Key Capabilities | Documentation |
|---|---|---|---|
| 🤖 **`@tempot/ai-core`** | Multi-provider LLM & embeddings | Vercel AI SDK integration (Gemini, OpenAI, DeepSeek, Ollama), vector generation | [Read Docs](./ai-core/README.md) |
| 🔍 **`@tempot/search-engine`** | Typed search planner | Exact & semantic query normalization, pagination metadata, 30-min cached states | [Read Docs](./search-engine/README.md) |
| 📝 **`@tempot/cms-engine`** | Deterministic Dynamic CMS | Redis override cache ➔ PostgreSQL ➔ Static JSON catalog fallback | [Read Docs](./cms-engine/README.md) |
| 📄 **`@tempot/document-engine`** | Document generation & export | PDF, Excel, CSV, and Markdown file generation | [Read Docs](./document-engine/README.md) |
| 📥 **`@tempot/import-engine`** | Batch data ingestion engine | CSV/JSON/Excel import validation, chunked database ingestion | [Read Docs](./import-engine/README.md) |

---

### 4. 🚀 Storage, Messaging & Operations
| Package | Description | Key Capabilities | Documentation |
|---|---|---|---|
| ☁️ **`@tempot/storage-engine`** | Unified file & object storage | Multi-backend provider (Google Drive, AWS S3 / R2, Local filesystem, Telegram) | [Read Docs](./storage-engine/README.md) |
| 🔔 **`@tempot/notifier`** | Queue-backed broadcast service | Bulk messaging, rate-limit throttling, user delivery telemetry | [Read Docs](./notifier/README.md) |
| 💾 **`@tempot/backup-engine`** | Automated disaster recovery | Encrypted tarball dumps, S3/Drive upload, rehearsal database verification | [Read Docs](./backup-engine/README.md) |

---

### 5. 📊 Observability & UI/UX Helpers
| Package | Description | Key Capabilities | Documentation |
|---|---|---|---|
| 🪵 **`@tempot/logger`** | Dual logging system | Pino technical JSON logs with automatic PII redaction + persistent `AuditLogger` | [Read Docs](./logger/README.md) |
| ⏱️ **`@tempot/interaction-observability`** | User interaction timeline telemetry | Bot lifecycle events, handler latency tracking, execution step audit sink | [Read Docs](./interaction-observability/README.md) |
| 🚨 **`@tempot/sentry`** | Exception telemetry adapter | Sentry SDK integration with recursive PII scrubbing | [Read Docs](./sentry/README.md) |
| 🔘 **`@tempot/ux-helpers`** | Telegram UI component builder | Inline keyboards, pagination menus, confirm dialogs, responsive button rows | [Read Docs](./ux-helpers/README.md) |
| 📝 **`@tempot/input-engine`** | Interactive bot form wizard | Multi-step user input validation, type coercion, conversation step recovery | [Read Docs](./input-engine/README.md) |

---

## 🛠️ Feature Toggle Matrix (Environment Variables)

Each non-core package can be dynamically enabled or disabled via environment variables in `.env`:

```env
TEMPOT_AUTH=true
TEMPOT_SESSIONS=true
TEMPOT_NOTIFIER=true
TEMPOT_LOGGER=true
TEMPOT_AI=true
TEMPOT_STORAGE=true
TEMPOT_BACKUP=true
TEMPOT_REGIONAL=true
TEMPOT_INPUT=true
TEMPOT_DYNAMIC_CMS=true
TEMPOT_SEARCH=true
TEMPOT_DOCUMENTS=true
TEMPOT_IMPORT=true
TEMPOT_SENTRY=false
```
