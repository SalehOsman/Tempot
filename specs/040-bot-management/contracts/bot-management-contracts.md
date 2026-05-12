# Bot Management Contracts

**Feature:** 040-bot-management
**Generated:** 2026-05-12

---

## Command Shortcuts

| Command | Purpose | Primary Menu Equivalent |
| --- | --- | --- |
| `/bots` | Open bot management menu | Bot management root menu |
| `/new_bot` | Start bot registration wizard | Register new bot button |

Commands are shortcuts only. Primary interaction remains menu-driven.

---

## Callback Namespace

All callbacks use the `botmgmt:` namespace.

| Pattern | Purpose |
| --- | --- |
| `botmgmt:menu` | Root bot management menu |
| `botmgmt:list` | Paginated bot list |
| `botmgmt:create` | Start registration |
| `botmgmt:view:{botId}` | Bot detail view |
| `botmgmt:edit:{botId}` | Edit metadata |
| `botmgmt:lifecycle:{botId}` | Lifecycle action menu |
| `botmgmt:settings:{botId}` | Settings profile menu |
| `botmgmt:modules:{botId}` | Module enablement menu |
| `botmgmt:provision` | Create from template flow |
| `botmgmt:health:{botId}` | Health view |
| `botmgmt:export:{botId}` | Export menu |
| `botmgmt:import` | Import profile flow |
| `botmgmt:search` | Search prompt |
| `botmgmt:page:{stateId}` | Paginated results |

---

## Export Contract

Exported bot profiles must include non-sensitive setup data and must never
include raw credentials.

Required top-level fields:

- `schema`: profile schema identifier
- `bot`: identity and metadata
- `settings`: settings profile
- `modules`: module enablement states
- `templateSource`: optional template attribution
- `health`: latest health summary
- `credentialSetup`: required credential setup instructions
- `exportedAt`
- `exportedBy`

---

## Import Contract

Import accepts the export shape above and returns one of:

- success with a new `DRAFT` bot ID
- validation failure with field-level issues
- blocked import with missing requirements

Import must never activate a bot automatically.
