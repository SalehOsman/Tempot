# Bot Management Lifecycle Operations Hardening - Data Model

**Feature:** 042-bot-management-lifecycle-operations-hardening  
**Generated:** 2026-05-13

---

## Overview

This feature does not add persistence models. It adds runtime interaction
contracts that project existing lifecycle domain behavior into Telegram inline
menus and guided reason flows.

## Interaction Contracts

### LifecycleActionMenu

| Field | Description |
| --- | --- |
| `botId` | Managed bot identifier |
| `status` | Current lifecycle state |
| `allowedTargets` | Valid next states derived from transition policy |
| `actions` | Inline buttons mapped to valid targets |
| `backAction` | Return-to-detail callback |

### LifecycleTransitionIntent

| Field | Description |
| --- | --- |
| `botId` | Managed bot identifier |
| `targetStatus` | Desired lifecycle target |
| `actorId` | Telegram actor identifier |
| `requiresReason` | Whether the transition requires reason capture |
| `requiresConfirmation` | Whether confirmation must happen before continuation |

### LifecycleReasonForm

| Field | Description |
| --- | --- |
| `formId` | Stable lifecycle conversation identifier |
| `botId` | Managed bot identifier |
| `targetStatus` | Lifecycle target to apply after successful form completion |
| `reason` | Non-empty trimmed free-text operational reason |
| `cancelOutcome` | Non-mutating user feedback path |

### LifecycleArchiveConfirmation

| Field | Description |
| --- | --- |
| `botId` | Managed bot identifier |
| `confirmAction` | Continue into reason collection |
| `cancelAction` | Return to lifecycle menu without mutation |

### LifecycleOperationOutcome

| State | Meaning |
| --- | --- |
| `UPDATED_DETAIL` | Lifecycle transition succeeded and detail view is refreshed |
| `INVALID_TRANSITION` | Service rejected state change |
| `MISSING_BOT` | Managed bot no longer exists or cannot be loaded |
| `FLOW_CANCELLED` | Guided reason flow exited without mutation |
| `SERVICE_FAILURE` | Existing lifecycle service or event publication returned an error |

## Persistence Impact

- No new Prisma model.
- Existing `ManagedBot` status field remains the lifecycle source of truth.
- Existing lifecycle history repository continues to persist transition records.
- Existing lifecycle event publication remains unchanged and service-owned.

## Error and UX Constraints

- Missing bot errors route to existing localized not-found feedback.
- Invalid transition errors route to existing localized invalid-transition
  feedback.
- Archive confirmation cancel does not create lifecycle events or history.
- Reason form cancellation does not invoke lifecycle persistence.
