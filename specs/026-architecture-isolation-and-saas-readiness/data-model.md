# Data Model: Architecture Isolation and SaaS Readiness

**Feature**: 026-architecture-isolation-and-saas-readiness  
**Date**: 2026-04-28

This data model documents planning and governance entities. It does not require production database tables during the first implementation slice.

## BoundaryComponent

Represents one architectural unit that can own behavior or configuration.

| Field | Description | Validation |
| --- | --- | --- |
| `id` | Stable component identifier such as `apps/bot-server` or `packages/database` | Must be unique |
| `type` | Component category: app, package, module, docs, tooling | Must be one of the documented categories |
| `responsibility` | Short statement of what the component owns | Must be specific and non-overlapping where possible |
| `publicContract` | How other components may use it | Must reference package exports, app entrypoints, events, or docs as applicable |
| `optional` | Whether the component can be disabled or deferred | Must align with roadmap |

## BoundaryRule

Defines one allowed, restricted, or prohibited dependency relationship.

| Field | Description | Validation |
| --- | --- | --- |
| `id` | Stable rule identifier | Must be unique |
| `sourceType` | Component type that initiates dependency | Must match BoundaryComponent type |
| `targetType` | Component type being depended on | Must match BoundaryComponent type |
| `classification` | Allowed, restricted, prohibited | Must include rationale |
| `rationale` | Why the rule exists | Must reference constitution or architecture principle |
| `enforcement` | Manual, lint, CI, review checklist, or future automation | Must have at least one planned enforcement mode |

## ViolationFinding

Documents a mismatch between current project state and the desired boundary model.

| Field | Description | Validation |
| --- | --- | --- |
| `id` | Stable finding identifier | Must be unique |
| `severity` | Critical, high, medium, low | Must include impact |
| `source` | Component or file where the issue originates | Must be traceable |
| `target` | Component or file being incorrectly depended on | Must be traceable |
| `rule` | BoundaryRule violated | Must reference an existing rule |
| `remediation` | Proposed RemediationItem | Required for critical and high findings |

## RemediationItem

Defines one scoped improvement.

| Field | Description | Validation |
| --- | --- | --- |
| `id` | Stable remediation identifier | Must be unique |
| `scope` | Documentation, configuration, test, CI, package, module, or app | Must avoid unrelated scope mixing |
| `ownerComponent` | Component responsible for the fix | Must map to BoundaryComponent |
| `acceptanceCriteria` | Measurable completion condition | Must be testable |
| `blockedBy` | Prior remediation items, if any | Must avoid circular task dependencies |

## ProductLayer

Defines the split between current framework and future SaaS.

| Field | Description | Validation |
| --- | --- | --- |
| `name` | Tempot Core or Tempot Cloud | Must be one of the approved layers |
| `responsibility` | Product-level responsibility | Must not overlap with the other layer |
| `currentStatus` | Active, future, or deferred | Must align with roadmap |
| `boundaryPrinciples` | Rules that keep the layer separate | Must be explicit |

## ScopeContext

Defines future SaaS and multi-bot ownership context.

| Field | Description | Validation |
| --- | --- | --- |
| `tenantId` | Future customer or organization scope | Optional during Tempot Core work |
| `workspaceId` | Future workspace/project scope | Optional during Tempot Core work |
| `botId` | Bot runtime or managed bot scope | Required for future managed-bot lifecycle |
| `userId` | Acting user or owner | Required for auditable actions |
| `role` | Authorization role | Must align with auth-core roles |

## TelegramManagedBotOpportunity

Records Telegram platform capability assessment.

| Field | Description | Validation |
| --- | --- | --- |
| `sourceUrl` | Official Telegram documentation URL | Must be official Telegram documentation |
| `reviewedAt` | Date of assessment | Must be recorded |
| `impact` | Positive, neutral, negative, or mixed | Must include rationale |
| `recommendedTiming` | Now, after hardening, deferred, or rejected | Must include rationale |
| `securityNotes` | Token, ownership, and audit risks | Required |

## State Transitions

### Boundary Hardening

```text
Draft Model -> Audited Inventory -> Enforced Rules -> Remediated Findings -> CI-Protected Boundaries
```

### SaaS Track

```text
Strategic Concept -> Readiness Model -> Future Spec -> Approved Implementation -> Tempot Cloud Product Layer
```

### Telegram Managed Bots

```text
Platform Update -> Product Assessment -> Future Spec -> Security Design -> Optional Managed Bot Capability
```
