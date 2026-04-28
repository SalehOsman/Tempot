# Quickstart: Architecture Isolation and SaaS Readiness

**Feature**: 026-architecture-isolation-and-saas-readiness
**Audience**: Project owner, technical advisor, executor

## Goal

Use this quickstart to validate that the planning artifacts are complete and ready for execution.

## Prerequisites

- Repository is on a feature branch, not `main`.
- Node.js 22.12+ is active.
- pnpm 10+ is available.
- Docker is available if integration tests are later required.

## Step 1: Review the Feature Spec

Read:

```bash
specs/026-architecture-isolation-and-saas-readiness/spec.md
```

Expected result:

- No `[NEEDS CLARIFICATION]` markers.
- User stories cover boundary isolation, SaaS readiness, Telegram Managed Bots, and template usability.
- The recommendation is to continue Tempot Core and prepare Tempot Cloud later.

## Step 2: Review Research Decisions

Read:

```bash
specs/026-architecture-isolation-and-saas-readiness/research.md
```

Expected result:

- Tempot Core remains the current priority.
- Tempot Cloud is documented as a future product layer.
- Telegram Managed Bots are classified as positive and deferred until boundary hardening.

## Step 3: Review Contracts

Read:

```bash
specs/026-architecture-isolation-and-saas-readiness/contracts/boundary-contract.md
specs/026-architecture-isolation-and-saas-readiness/contracts/saas-readiness-contract.md
specs/026-architecture-isolation-and-saas-readiness/contracts/telegram-managed-bots-contract.md
```

Expected result:

- Boundary governance outputs are explicit.
- Tempot Core and Tempot Cloud responsibilities are separated.
- Managed bot capability is isolated as a future optional track.

## Step 4: Run Spec Validation

Run:

```bash
pnpm spec:validate
```

Expected result:

```text
--- Summary: all active checks pass ---
```

## Step 5: Review Execution Plan

Read:

```bash
docs/archive/superpowers/plans/2026-04-28-architecture-isolation-and-saas-readiness.md
```

Expected result:

- Tasks are ordered.
- The first implementation slice is audit and documentation.
- Production code enforcement is not started before approval.

## Step 6: Decide Execution Mode

Recommended execution mode:

```text
subagent-driven-development
```

Fallback execution mode:

```text
executing-plans
```
