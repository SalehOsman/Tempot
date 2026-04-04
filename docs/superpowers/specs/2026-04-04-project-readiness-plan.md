# Project Readiness Plan — From Phase 1 Completion to Module Development

**Date:** 2026-04-04
**Phase:** Pre-Module Readiness
**Status:** Active
**Author:** Technical Advisor (via Project Manager approval)

This document captures the comprehensive plan to bring Tempot from its current state (13 built Phase 1 packages) to full readiness for business module development. It was produced after a thorough project audit on 2026-04-04.

---

## Current State Summary

### What Works

- **13 packages built on main:** shared, logger, database, event-bus, auth-core, session-manager, i18n-core, regional-engine, storage-engine, ux-helpers, input-engine, ai-core, sentry
- **208 source files, 173 test files** — zero TODO/FIXME/HACK, zero eslint-disable
- **Infrastructure:** TypeScript Strict, ESLint + boundary rules, Vitest, Husky, CI (6 jobs), Docker Compose, `pnpm spec:validate`, Changesets

### What's Missing (Audit Findings)

#### Category A — Block Module Development

1. **`settings` package missing entirely** — Referenced in spec Section 11 (core/non-optional), dependency tree (Appendix A), Pluggable Architecture (Section 30). No spec artifacts exist.
2. **5 remaining Phase 1 packages not ready** — cms-engine, notifier, search-engine, document-engine, import-engine have only spec.md + plan.md. Missing: tasks.md, data-model.md, research.md. Cannot pass Handoff Gate.
3. **module-registry = README placeholder only** — No package.json, no src/, no code.
4. **bot-server = 72-line prototype** — No middleware, no Hono, no health check, labeled [PROTOTYPE].

#### Category B — Important Gaps

5. **`pnpm generate:module` is a phantom** — Referenced in 8 places but never implemented.
6. **No build orchestration** — No Turbo, no Nx.
7. **Error Reference System not implemented** (Rule XXIV).

#### Category C — Documentation Issues

8. ADR reference conflicts in constitution (Rule II, Rule XXIII).
9. Stale documents (CHAT-ONBOARDING.md, ecosystem-reference.md, ROADMAP).
10. Duplicate rules (Rules I/LXX and VII/LXX).
11. Dual ADR indexes.

---

## The Plan

### Phase 1A: Documentation Cleanup (1 session)

**Executor:** Claude Code
**Goal:** Fix all Category C documentation issues so the project's written artifacts are accurate.

**Tasks:**

1. Update ROADMAP.md — input-engine status (merged), add settings row, update Next Action
2. Fix ADR reference conflicts in constitution.md (Rule II → ADR-029, Rule XXIII → ADR-033)
3. Update CHAT-ONBOARDING.md (remove stale session-manager reference)
4. Update ecosystem-reference.md (AI SDK v4.x → v6.x)
5. Unify ADR indexes (replace docs/adr/README.md with redirect to canonical docs/architecture/adr/README.md)
6. Add cross-reference notes to duplicate Rule LXX

**Status:** In progress (current session)

### Phase 1B: Complete SpecKit for 6 Packages (6 Gemini sessions)

**Executor:** Gemini CLI (SpecKit toolchain)
**Goal:** Produce all required spec artifacts so each package passes the Handoff Gate.

**Packages and order:**

1. **settings** — Full `/speckit.specify` from scratch (no existing artifacts)
2. **cms-engine** — `/speckit.clarify` → data-model → research → `/speckit.tasks` → `/speckit.analyze`
3. **notifier** — Same flow as cms-engine
4. **search-engine** — Same flow as cms-engine
5. **document-engine** — Same flow as cms-engine
6. **import-engine** — Same flow as cms-engine

**Handoff Gate criteria (each package):**

- spec.md exists with no `[NEEDS CLARIFICATION]` markers
- plan.md exists
- tasks.md exists
- data-model.md exists
- research.md exists
- `/speckit.analyze` passes
- `pnpm spec:validate` passes with 0 CRITICAL

### Phase 1C: Build 6 Packages (6 execution sessions, sequential)

**Executor:** Claude Code (Superpowers toolchain)
**Goal:** Implement each package following full methodology (TDD, Result pattern, i18n, etc.)

**Build order (dependency-driven):**

1. **settings** — No unbuilt dependencies
2. **cms-engine** — Depends on: i18n-core ✅, database ✅, event-bus ✅, shared/cache ✅
3. **notifier** — Depends on: shared/queue ✅, i18n-core ✅, database ✅
4. **search-engine** — Depends on: database ✅, shared/cache ✅, ai-core ✅
5. **document-engine** — Depends on: shared/queue ✅, event-bus ✅, storage-engine ✅, i18n-core ✅
6. **import-engine** — Depends on: document-engine (must be built first!)

**Per-package workflow:**

- Technical Advisor writes Phase B executor prompt (using `.specify/templates/executor-prompt-template.md`)
- PM delivers prompt to Executor
- Executor uses Superpowers: brainstorming → writing-plans → subagent-driven-development (TDD) → requesting-code-review → verification-before-completion → finishing-a-development-branch
- Technical Advisor reviews from actual files (not executor report)
- Package checklist validation (`docs/developer/package-creation-checklist.md`)
- Merge to main

### Phase 2: Module Infrastructure (2-3 sessions)

**Goal:** Build the infrastructure that enables business modules to register and run.

**Build order:**

1. **module-registry** — Full SpecKit + Superpowers cycle. Implements module lifecycle management per spec Section 15.
2. **bot-server reconstruction** — Replace 72-line prototype with production bot assembly. Hono web server, grammY middleware pipeline, health checks per spec Section 14.
3. **CLI Generator** (optional) — Implement `pnpm generate:module` or remove all references to it.

### Phase 3: Test Module — person-registration (1-2 sessions)

**Goal:** Validate that ALL Phase 1 packages + module infrastructure work together in a real business module.

**Scope (PM decisions):**

- Tests all 19 Phase 1 packages (13 existing + 6 new)
- Full Section 15 mandatory module structure
- Comprehensive registration flow (10+ fields)
- Full SpecKit + Superpowers methodology

---

## Dependency Chain

Phase 1A (docs) → no dependencies
Phase 1B (specs) → no dependencies (can run parallel with 1A)
Phase 1C (build) → depends on 1B completion for each package
settings → standalone
cms-engine → all deps on main ✅
notifier → all deps on main ✅
search-engine → all deps on main ✅
document-engine → all deps on main ✅
import-engine → depends on document-engine (Phase 1C.5)
Phase 2 → depends on Phase 1C completion
Phase 3 → depends on Phase 2 completion

## Timeline Estimate

| Phase     | Sessions  | Estimated Duration   |
| --------- | --------- | -------------------- |
| 1A        | 1         | 1 session            |
| 1B        | 6         | 6 Gemini sessions    |
| 1C        | 6         | 6 execution sessions |
| 2         | 2-3       | 2-3 sessions         |
| 3         | 1-2       | 1-2 sessions         |
| **Total** | **16-18** | **16-18 sessions**   |

## Success Criteria

The project is ready for business module development when:

1. All 19 Phase 1 packages are built, tested, and merged to main
2. module-registry is fully implemented
3. bot-server is production-ready (not prototype)
4. person-registration module works end-to-end
5. All documentation is accurate and consistent
6. `pnpm spec:validate` passes with 0 CRITICAL across all packages
