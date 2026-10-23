# The 10 Invariant Kernel Modules Inventory

## 1. Overview
The **Tembot-v2 Platform** organizes foundational infrastructure, security, and governance capabilities into 10 autonomous Kernel modules located at `modules/kernel/<module>/`.

These modules are invariant across all deployments and provide core capabilities that domain modules consume.

---

## 2. Kernel Modules Catalog

| Module Slug | Context Cluster | Core Responsibility | Exposed Capabilities |
| :--- | :--- | :--- | :--- |
| **`system-settings`** | `governance-hub` | Tri-surface branding, bot greeting copy, maintenance toggle. | `settings:read`, `settings:write` |
| **`access-control`** | `governance-hub` | Hybrid Capability Engine (`ctx.can`), HMAC `initData` auth, operator sessions. | `auth:authenticate`, `auth:revoke`, `access:manage` |
| **`audit-log`** | `observability-hub` | Append-only immutable forensic audit trail, structured telemetry breadcrumbs. | `audit:read`, `audit:export` |
| **`system-clock`** | `operations` | Deterministic time authority (`SystemTime`), clock pinning, and test temporal anchors. | `clock:read`, `clock:pin` |
| **`performance-telemetry`** | `observability-hub` | Sub-300ms latency tracking, BullMQ queue depths, RAM/CPU monitoring. | `telemetry:read` |
| **`backup-vault`** | `operations-hub` | Automated and on-demand database snapshots, cryptographic archive sealing. | `backup:execute`, `backup:restore` |
| **`task-scheduler`** | `operations-hub` | BullMQ background queues, Bull-Board visual monitor, recurring cron runner. | `tasks:read`, `tasks:manage` |
| **`broadcast-engine`** | `communications-hub` | Rate-limited Telegram broadcast pipeline (< 30 msg/s), flood-wait protection. | `broadcast:publish`, `broadcast:read` |
| **`media-storage`** | `communications-hub` | Telegram `file_id` caching, MinIO / S3 storage adapters, Excel report generator. | `media:upload`, `media:read` |
| **`google-services`** | `integrations-hub` | Google Cloud gateway (Drive sync, Sheets engine, Gemini AI integration). | `google:sync`, `google:manage` |

---

## 3. Boundary & Encapsulation Guarantees

1. **Owned Schemas:** Each kernel module owns its respective database tables and migrations under `db/`.
2. **Public Barrel:** Other modules access kernel services exclusively through `index.ts` and declared public ports.
3. **No Circular Dependencies:** The kernel registry validates during boot that module dependencies form an acyclic graph.
