# Input Engine Inline Flow Standardization - Technical Research

**Feature:** 041-input-engine-inline-flow-standardization  
**Source:** spec.md  
**Generated:** 2026-05-12

---

## Overview

The repository already contains a substantial `@tempot/input-engine` package with
conversation-oriented runner logic and broad unit coverage. The current gap is
not the absence of a form engine; it is the missing visible adoption path in the
active bot runtime and the resulting drift in the first production module that
needs structured multi-step input.

---

## Research Topic 1: Runtime Ownership

### Question

Where should conversation middleware and host wiring live?

### Decision

`apps/bot-server` owns runtime conversation integration. Modules own domain flow
definitions only. `@tempot/input-engine` remains the reusable package contract.

### Rationale

Conversation middleware is runtime infrastructure tied to grammY bot creation,
middleware ordering, startup, and shutdown. That belongs in the app interface
layer, not in business modules.

### Alternatives Considered

- **Module-local runtime hooks**: Rejected because every module would need to
  reassemble platform infrastructure.
- **Move runtime boot into the package**: Rejected because package-level reusable
  contracts should not own bot-server lifecycle composition.

---

## Research Topic 2: Bot Management Registration Flow

### Question

Should the existing manual text-state registration remain, be wrapped, or be
replaced?

### Decision

Replace it with an `@tempot/input-engine` form and remove the manual production
state path after equivalent tests exist.

### Rationale

The approved capability standard explicitly rejects rebuilding multi-step input
flows locally when `@tempot/input-engine` covers the need. Keeping both paths
would create an avoidable dual standard.

### Alternatives Considered

- **Keep the state map as a fallback**: Rejected because it preserves the lower
  standard and invites divergence.
- **Wrap the state map behind the input-engine API**: Rejected as a workaround,
  not a source fix.

---

## Research Topic 3: Entry Point Consistency

### Question

How should `/new_bot` and inline bot creation interact?

### Decision

Both entry points start the same form definition and converge on the same success
and cancellation routes.

### Rationale

Commands are entry points, inline menus are the primary navigation surface, and
domain persistence must not vary by entry method.

### Alternatives Considered

- **Separate command-only and menu-only implementations**: Rejected due to
  duplicated behavior and poorer testability.
- **Inline-only flow with command deprecation**: Rejected because the project
  standard keeps commands as shortcuts and discovery points.

---

## Research Topic 4: Package Documentation Drift

### Question

Why update package documentation in the same feature?

### Decision

Reconcile `packages/input-engine/README.md` as part of the same feature.

### Rationale

The README currently understates implementation status and does not fully reflect
the existing package surface. Leaving it stale would continue to misdirect future
module work even after runtime adoption is corrected.

### Alternatives Considered

- **Defer docs to a later housekeeping task**: Rejected because Rule L requires
  code-documentation parity.
- **Add only a short note in the module docs**: Rejected because the source of
  confusion is the package documentation itself.

---

## Research Topic 5: Scope Boundary

### Question

Should every module be migrated to the inline-flow standard in this feature?

### Decision

No. This feature establishes the shared runtime path and proves the standard in
`bot-management`. Broader module migrations must be scheduled as separate scoped
features or tasks after the foundation is verified.

### Rationale

Migrating every module at once would violate the clean-diff and single-concern
rules. The root issue is the absence of a proven shared path; once that exists,
subsequent modules can adopt it predictably.

### Alternatives Considered

- **Repository-wide immediate migration**: Rejected because it would broaden the
  blast radius and blur verification.
- **Runtime-only change with no module adoption**: Rejected because it would leave
  the standard unproven in a real production flow.

---

## Summary of Decisions

| Topic | Decision |
| --- | --- |
| Runtime ownership | `apps/bot-server` hosts conversations; modules define flows |
| Bot registration | Replace manual state flow with `@tempot/input-engine` |
| Entry points | `/new_bot` and inline create converge on one shared form |
| Documentation | Reconcile input-engine README in the same feature |
| Scope boundary | Prove standard in bot-management now; migrate other modules later |
