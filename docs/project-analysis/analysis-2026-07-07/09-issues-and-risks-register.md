# 09 - Issues and Risks Register

## P0 Issues

### I001 - Spec #057 production evidence remains open

| Field | Value |
| --- | --- |
| Severity | P0 for production. |
| Impact | Blocks production release. |
| Evidence | 16 open tasks remain in `specs/057-production-delivery-hardening/tasks.md`. |
| Required fix | Complete external staging smoke, immutable promotion, rollback/forward-fix rehearsal, metrics, alerts, review, and go/no-go evidence. |

### I002 - Spec #058 access gate is incomplete

| Field | Value |
| --- | --- |
| Severity | P0 before beta or real-user exposure. |
| Impact | Unknown/pending visitor behavior and admin membership workflow are not fully complete. |
| Evidence | 22 open tasks remain in `specs/058-bot-access-mode-membership-gate/tasks.md`. |
| Required fix | Finish audit, event, idempotency, admin settings, scenario tests, docs, integration, and review tasks. |

### I003 - Dirty local workspace must not be deployed

| Field | Value |
| --- | --- |
| Severity | P0 if used for deployment. |
| Impact | Could deploy unreviewed local feature work. |
| Evidence | 59 status entries before this snapshot; many are active #058 changes. |
| Required fix | Deploy only clean signed `origin/main` digest for staging; merge local work only after full gates. |

## P1 Issues

### I004 - Stale source artifact in `src`

| Field | Value |
| --- | --- |
| Severity | P1; merge blocker. |
| Evidence | `apps/bot-server/src/bot-server.types.js` exists locally. |
| Rule | LXXVIII. |
| Required fix | Delete the artifact in a scoped cleanup task and run `source:conformance`. |

### I005 - `eslint-disable` in webhook script

| Field | Value |
| --- | --- |
| Severity | P1; methodology blocker. |
| Evidence | `apps/bot-server/scripts/webhook-manager.ts:1-2`. |
| Rule | I. |
| Required fix | Refactor the script to satisfy lint without suppressions. |

### I006 - Developer-facing Arabic and mojibake documentation

| Field | Value |
| --- | --- |
| Severity | P1. |
| Evidence | Prior analysis folders, architecture spec, prompt docs, troubleshooting docs, and some TypeScript comments. |
| Rule | XL and LXII. |
| Required fix | Translate active docs to English, archive or remove obsolete docs, and implement methodology-lint enforcement. |

### I007 - Architecture source-of-truth drift

| Field | Value |
| --- | --- |
| Severity | P1. |
| Evidence | `docs/architecture/tempot_architecture.md` is active but corrupted/mojibake and not reliable as a current architecture guide. |
| Required fix | Rebuild the active architecture spec in English from current ADRs, roadmap, and code. |

### I008 - Local pnpm drift

| Field | Value |
| --- | --- |
| Severity | P1 for release verification. |
| Evidence | Corepack pnpm is `10.33.3`; direct pnpm is `11.7.0`. |
| Required fix | Use Corepack or correct PATH before release gates. |

## P2 Issues

### I009 - Spec #060/#061 references are not materialized

| Field | Value |
| --- | --- |
| Severity | P2 now; P1 when #059 starts. |
| Evidence | Spec #059 references #060 and #061, but the current spec list ends at #059. |
| Required fix | Create cleanup specs before #059 implementation depends on their ownership metadata. |

### I010 - Product Arabic docs need explicit classification

| Field | Value |
| --- | --- |
| Severity | P2. |
| Evidence | `docs/product/ar/` contains intentional Arabic product documentation. |
| Required fix | Declare whether localized end-user docs are exempt from Rule XL or governed by a separate localization policy. |

## Risk Summary

| Priority | Issues |
| --- | --- |
| P0 | I001, I002, I003 |
| P1 | I004, I005, I006, I007, I008 |
| P2 | I009, I010 |

