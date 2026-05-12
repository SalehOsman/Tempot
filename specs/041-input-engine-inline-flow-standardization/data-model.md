# Input Engine Inline Flow Standardization - Data Model

**Feature:** 041-input-engine-inline-flow-standardization  
**Source:** spec.md + research.md  
**Generated:** 2026-05-12

---

## Overview

This feature is primarily runtime and orchestration work. It does not introduce a
new database schema. Instead, it defines stable runtime and flow-level contracts
that connect the bot server, `@tempot/input-engine`, and `bot-management`.

---

## Runtime Contracts

### InputFlowRuntimeBinding

App-level registration boundary for conversation-backed flows.

| Field | Description |
| --- | --- |
| `bot` | Active grammY bot instance created by bot-server |
| `conversationMiddleware` | Shared conversation middleware host |
| `registeredFlows` | Named package-backed forms available to modules |
| `registrationOrder` | Placement relative to existing middleware and module loading |

### ConversationFlowLifecycle

Lifecycle states expected by runtime tests.

| State | Meaning |
| --- | --- |
| `READY` | Flow route can be entered |
| `ACTIVE` | Conversation is waiting for additional user input |
| `COMPLETED` | Form produced a validated result |
| `CANCELLED` | User or flow logic exited without persistence |
| `FAILED_VALIDATION` | Input was rejected and the flow remains recoverable |

---

## Bot Management Contracts

### BotRegistrationFormDefinition

Module-owned configuration passed into `@tempot/input-engine`.

| Field | Description |
| --- | --- |
| `formId` | Stable form identifier |
| `entryPoints` | Command and inline-action routes that start the same form |
| `fields` | Ordered registration fields matching current service requirements |
| `validation` | Schema and per-field validation rules |
| `confirmation` | Package confirmation policy; bot registration keeps direct completion disabled in the current implementation |
| `successRoute` | Post-create bot detail navigation target |
| `cancelRoute` | Localized non-persisting cancellation response owned by the module flow |

### BotRegistrationSubmission

Validated data passed to the existing domain service.

| Field | Description |
| --- | --- |
| `displayName` | Admin-facing bot name |
| `telegramUsername` | Managed bot username |
| `tokenInput` | Sensitive credential input passed to existing safe service logic |
| `ownerId` | Actor or selected bot owner |
| `runtimeMode` | Polling or webhook |
| `defaultLocale` | Default bot locale |
| `defaultCountry` | Default regional setting |
| `timezone` | Display timezone |

### BotRegistrationOutcome

| State | Meaning |
| --- | --- |
| `CREATED` | Domain service persisted a new managed bot |
| `DUPLICATE_REJECTED` | Existing identity conflict from the service layer |
| `VALIDATION_REJECTED` | Form or schema validation prevented persistence |
| `CANCELLED` | User exited before service invocation |

---

## Removed Local Contract

### ManualRegistrationSessionState

This production-only concept becomes obsolete after the new form path is active.
It may remain in test fixtures only if absolutely needed during migration, but it
must not remain as the operative registration state model.

---

## Persistence Impact

- No new Prisma model.
- Existing `bot-management` repositories and services remain authoritative for
  persistence.
- The feature changes how validated data reaches those services, not the stored
  bot registry structure itself.

---

## Event and Error Considerations

- Existing bot-management service events continue to represent successful bot
  creation.
- Conversation cancellation must not emit creation events.
- Duplicate identity failures remain domain errors from the registration service
  rather than form-owned uniqueness logic.
