# Data Access Boundary Baseline

**Date:** 2026-06-15  
**Feature:** Spec 055 data integrity hardening

## Permitted Infrastructure Access

These operations are low-level application infrastructure and remain explicit
Prisma exceptions:

| File                                               | Operation                                   | Reason                       |
| -------------------------------------------------- | ------------------------------------------- | ---------------------------- |
| `apps/bot-server/src/startup/deps.orchestrator.ts` | `$connect`                                  | Database lifecycle bootstrap |
| `apps/bot-server/src/startup/shutdown.ts`          | `$disconnect`                               | Database lifecycle shutdown  |
| `apps/bot-server/src/startup/health.probes.ts`     | `$queryRaw` health probe                    | Low-level connectivity check |
| `modules/*/database/migrations/`                   | migration SQL                               | Migration infrastructure     |
| `packages/database/src/`                           | Prisma client and repository implementation | Owning data-access package   |
| Test helpers and integration tests                 | fixture setup and assertions                | Test infrastructure          |

## Confirmed Prohibited Application Access

These calls must move behind purpose-specific repositories during the
repository-boundary continuation of Spec 055:

| File                                               | Current operation           | Required owner               |
| -------------------------------------------------- | --------------------------- | ---------------------------- |
| `apps/bot-server/src/startup/deps.orchestrator.ts` | `auditLog.findMany`         | Audit-history repository     |
| `apps/bot-server/src/startup/deps.orchestrator.ts` | `interactionEvent.findMany` | Interaction-event repository |
| `apps/bot-server/src/startup/bootstrap.ts`         | `session.upsert`            | Bootstrap-session repository |

## Enforcement Direction

The boundary audit will classify direct Prisma imports and invocations in
services, handlers, and application orchestration as violations while
preserving the narrow infrastructure exceptions above. This enforcement is
part of the post-Spec-054 continuation and is not claimed complete by the
current foundation.

## Implemented Foundation

Normal repository reads no longer expose `BaseRepository.findMany` publicly
and cannot override the shared active-record scope. Prisma applies that scope
only to models that implement soft delete. Template and bot module repositories
reuse the same enforcement helper instead of defining caller-overridable
policies.

The storage purge worker retains a purpose-specific internal query for expired
deleted attachments. It does not expose caller-controlled deletion filters and
is separate from the still-open authorized recovery contract.
