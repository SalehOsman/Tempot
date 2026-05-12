# Bot Management Module - Data Model

**Feature:** 040-bot-management
**Source:** spec.md + research.md
**Generated:** 2026-05-12

---

## Overview

The module owns operational records for managed bots. The model is designed for
governance, auditability, safe import/export, and future runtime integration
without controlling runtime processes directly.

---

## Entities

### ManagedBot

Authoritative record for a bot managed by Tempot.

| Field | Description | Validation |
| --- | --- | --- |
| `id` | Stable identifier | Required |
| `displayName` | Admin-facing bot name | 1-120 characters |
| `telegramUsername` | Telegram bot username | Unique among non-archived bots |
| `tokenFingerprint` | Stable fingerprint for duplicate detection | Required after credential setup |
| `tokenRedacted` | Redacted display value | Never reveals full token |
| `ownerId` | User responsible for the bot | Required |
| `runtimeMode` | `POLLING` or `WEBHOOK` | Required before `CONFIGURED` |
| `status` | Bot lifecycle status | See lifecycle model |
| `defaultLocale` | Default locale | Required |
| `defaultCountry` | Default country/region | Required |
| `timezone` | Display timezone | Required |
| `healthStatus` | Latest health summary | `unknown`, `healthy`, `degraded`, `unhealthy` |
| `createdAt` / `updatedAt` | Audit timestamps | Required |
| `isDeleted` / `deletedAt` / `deletedBy` | Soft-delete fields | Required |

### BotSettingsProfile

Per-bot settings profile.

| Field | Description | Validation |
| --- | --- | --- |
| `id` | Stable identifier | Required |
| `botId` | Managed bot reference | Required, unique |
| `locale` | Preferred language | Required |
| `country` | Regional default | Required |
| `timezone` | Timezone for displays | Required |
| `notificationsEnabled` | Operational notifications flag | Boolean |
| `privacyMode` | Bot privacy behavior | Enum |
| `featureToggles` | Per-bot toggles | Structured JSON object |
| `createdAt` / `updatedAt` | Audit timestamps | Required |

### BotModuleEnablement

Per-bot module availability and chosen enablement state.

| Field | Description | Validation |
| --- | --- | --- |
| `id` | Stable identifier | Required |
| `botId` | Managed bot reference | Required |
| `moduleName` | Module identifier | Required |
| `state` | `ENABLED`, `DISABLED`, `UNAVAILABLE`, `BLOCKED` | Required |
| `blockedReason` | Human-reviewable blocked reason key | Required when `BLOCKED` |
| `enabledBy` | Actor who enabled the module | Required when `ENABLED` |
| `enabledAt` | Enablement timestamp | Required when `ENABLED` |
| `updatedAt` | Last changed timestamp | Required |

### BotTemplateSource

Optional template provenance for a bot created from a published template.

| Field | Description | Validation |
| --- | --- | --- |
| `id` | Stable identifier | Required |
| `botId` | Managed bot reference | Required, unique |
| `templateId` | Source template identifier | Required |
| `templateVersionId` | Source template version identifier | Required |
| `templateNameSnapshot` | Source template name at provisioning time | Required |
| `provisionedBy` | Actor who provisioned the bot | Required |
| `provisionedAt` | Provisioning timestamp | Required |

### BotLifecycleEvent

Append-only record of lifecycle changes.

| Field | Description | Validation |
| --- | --- | --- |
| `id` | Stable identifier | Required |
| `botId` | Managed bot reference | Required |
| `fromStatus` | Previous lifecycle status | Nullable for initial registration |
| `toStatus` | New lifecycle status | Required |
| `actorId` | User who performed the transition | Required |
| `reason` | Transition reason | Required for pause, maintenance, archive |
| `createdAt` | Event timestamp | Required |

### BotHealthSnapshot

Latest or historical health observation for a managed bot.

| Field | Description | Validation |
| --- | --- | --- |
| `id` | Stable identifier | Required |
| `botId` | Managed bot reference | Required |
| `status` | `unknown`, `healthy`, `degraded`, `unhealthy` | Required |
| `summaryKey` | i18n key for display summary | Required |
| `details` | Structured diagnostic metadata | Optional JSON object |
| `observedAt` | Observation timestamp | Required |

### BotProfileExport

Export request and artifact metadata.

| Field | Description | Validation |
| --- | --- | --- |
| `id` | Stable identifier | Required |
| `botId` | Managed bot reference | Required |
| `requestedBy` | Actor who requested export | Required |
| `format` | `JSON` or documentation format | Required |
| `artifactId` | Storage artifact reference | Required after completion |
| `status` | `PENDING`, `COMPLETED`, `FAILED` | Required |
| `createdAt` / `completedAt` | Processing timestamps | Required as applicable |

### BotProfileImport

Import request and validation outcome.

| Field | Description | Validation |
| --- | --- | --- |
| `id` | Stable identifier | Required |
| `requestedBy` | Actor who requested import | Required |
| `sourceArtifactId` | Uploaded artifact reference | Required |
| `createdBotId` | Created bot reference | Present on success |
| `status` | `PENDING`, `COMPLETED`, `FAILED` | Required |
| `validationErrors` | Structured validation errors | Present on validation failure |
| `blockedRequirements` | Missing modules/settings from imported profile | Optional list |
| `createdAt` / `completedAt` | Processing timestamps | Required as applicable |

---

## Lifecycle Model

### States

| State | Meaning |
| --- | --- |
| `DRAFT` | Bot profile is being created or imported and is not ready for activation. |
| `CONFIGURED` | Required identity, settings, and module requirements are complete. |
| `ACTIVE` | Bot profile is approved for runtime consumption. |
| `PAUSED` | Bot is intentionally paused but not archived. |
| `MAINTENANCE` | Bot is temporarily under operational maintenance. |
| `ARCHIVED` | Bot is no longer active in default operational views. |

### Valid Transitions

| From | To | Reason Required | Notes |
| --- | --- | --- | --- |
| `DRAFT` | `CONFIGURED` | No | Requires complete identity and settings. |
| `CONFIGURED` | `ACTIVE` | No | Admin activation. |
| `ACTIVE` | `PAUSED` | Yes | Keeps profile visible. |
| `PAUSED` | `ACTIVE` | No | Resume after pause. |
| `ACTIVE` | `MAINTENANCE` | Yes | Operational maintenance. |
| `PAUSED` | `MAINTENANCE` | Yes | Maintenance from paused state. |
| `MAINTENANCE` | `ACTIVE` | No | Return after maintenance. |
| `DRAFT` | `ARCHIVED` | Yes | Abandon incomplete bot profile. |
| `CONFIGURED` | `ARCHIVED` | Yes | Retire configured bot. |
| `ACTIVE` | `ARCHIVED` | Yes | Retire active bot. |
| `PAUSED` | `ARCHIVED` | Yes | Retire paused bot. |
| `MAINTENANCE` | `ARCHIVED` | Yes | Retire during maintenance. |

---

## Event Contracts

The module publishes these event categories:

| Event | Purpose |
| --- | --- |
| `bot-management.bot.registered` | A managed bot record was created. |
| `bot-management.bot.updated` | Bot identity or metadata changed. |
| `bot-management.lifecycle.changed` | Bot lifecycle status changed. |
| `bot-management.settings.changed` | Per-bot settings profile changed. |
| `bot-management.module-enablement.changed` | Module state changed for a bot. |
| `bot-management.provisioning.completed` | Bot profile was created from a template. |
| `bot-management.health.changed` | Health status changed. |
| `bot-management.export.completed` | Export artifact completed. |
| `bot-management.import.completed` | Import created a draft bot profile. |

---

## Import/Export Profile Shape

Exported profiles include:

- bot identity metadata
- lifecycle status as metadata only
- settings profile
- module enablement states and blocked reasons
- template source attribution
- latest health summary
- setup requirements for sensitive credentials

Exported profiles exclude:

- raw tokens
- secrets
- user session data
- runtime worker internals
- audit log internals

Imported profiles always create a new `DRAFT` bot profile.

---

## Repository Ownership

Each entity is owned by `modules/bot-management`. Services must not access
Prisma directly and must not import another module. Cross-module facts are
represented through IDs, events, and package-level contracts.
