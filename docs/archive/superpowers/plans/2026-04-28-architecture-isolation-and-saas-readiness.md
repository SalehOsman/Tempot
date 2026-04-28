# Architecture Isolation and SaaS Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` on Codex or `superpowers:executing-plans` where subagents are unavailable. Execute task-by-task with checkbox tracking.

**Goal:** Raise Tempot's architecture discipline by documenting and enforcing clean boundaries, defining a safe SaaS evolution path, and positioning Telegram Managed Bots as an optional future capability.

**Architecture:** This plan is a governance and architecture hardening track. It creates boundary maps, ADRs, audit reports, roadmap updates, and future CI enforcement plans before any production code is changed.

**Tech Stack:** SpecKit, Superpowers, TypeScript monorepo governance, ESLint boundaries, Vitest, GitHub Actions, Telegram Bot Platform.

---

## Phase 1: Establish Planning Baseline

**Files:**

- Review: `specs/026-architecture-isolation-and-saas-readiness/spec.md`
- Review: `specs/026-architecture-isolation-and-saas-readiness/plan.md`
- Review: `specs/026-architecture-isolation-and-saas-readiness/research.md`
- Review: `specs/026-architecture-isolation-and-saas-readiness/data-model.md`
- Review: `specs/026-architecture-isolation-and-saas-readiness/contracts/*.md`
- Review: `.specify/memory/constitution.md`
- Review: `docs/archive/tempot_v11_final.md`

- [ ] Confirm `pnpm spec:validate` is clean before implementation starts.
- [ ] Confirm spec #026 has no `[NEEDS CLARIFICATION]` markers.
- [ ] Confirm this planning branch contains only spec and architecture documentation changes.

## Phase 2: Boundary Governance Documents

**Files:**

- Create: `docs/archive/architecture/boundaries/component-inventory.md`
- Create: `docs/archive/architecture/boundaries/dependency-rules.md`
- Create: `docs/archive/architecture/boundaries/decision-matrix.md`

- [ ] Inventory every `apps/*`, `packages/*`, `modules/*`, and deferred package from `docs/archive/ROADMAP.md`.
- [ ] For each component, document responsibility, public API expectation, allowed dependencies, forbidden dependencies, and owner type.
- [ ] Define dependency directions that preserve separation of concerns.
- [ ] Define the decision matrix for where new work belongs.
- [ ] Review the output against Constitution rules for repository pattern, event-driven module communication, i18n-only, and Result pattern.

## Phase 3: Strategic ADRs

**Files:**

- Create: `docs/archive/architecture/adr/ADR-040-tempot-core-cloud-boundary.md`
- Create: `docs/archive/architecture/adr/ADR-041-telegram-managed-bots-strategy.md`
- Modify: `docs/archive/architecture/adr/README.md`

- [ ] ADR-040 must accept keeping Tempot Core as the current product and deferring Tempot Cloud to a later layer.
- [ ] ADR-040 must reject rewriting the current bot framework into SaaS immediately.
- [ ] ADR-041 must classify Telegram Managed Bots as a positive optional capability.
- [ ] ADR-041 must reject direct coupling between current bot-server flows and future Telegram Managed Bot automation.
- [ ] Update the ADR index after both ADRs are stable.

## Phase 4: Boundary Audit and Remediation

**Files:**

- Create: `docs/archive/architecture/boundaries/audit-report.md`
- Create: `docs/archive/architecture/boundaries/remediation-plan.md`
- Create: `docs/archive/architecture/boundaries/ci-enforcement-plan.md`
- Create: `docs/archive/developer/module-boundary-guide.md`

- [ ] Audit current imports and package boundaries using available repository tools.
- [ ] Record findings with severity, affected files, root cause, and remediation path.
- [ ] Keep remediation as a staged plan unless the Project Manager explicitly authorizes code edits.
- [ ] Define CI hardening targets: `pnpm spec:validate`, audit strictness, Docker build validation, boundary linting, and package checklist validation.
- [ ] Write a developer guide that explains how to change one module without touching unrelated project layers.

## Phase 5: SaaS Readiness Documents

**Files:**

- Create: `docs/archive/architecture/saas-readiness.md`
- Create: `docs/archive/architecture/saas-migration-map.md`

- [ ] Define Tempot Core responsibilities.
- [ ] Define future Tempot Cloud responsibilities.
- [ ] Document tenant scope, bot scope, future account ownership, billing isolation, admin dashboard scope, and deployment topology.
- [ ] Map current packages to SaaS concerns without proposing invasive rewrites.
- [ ] Explicitly document that current development should continue on the bot framework while preserving SaaS-ready boundaries.

## Phase 6: Telegram Managed Bots Strategy

**Files:**

- Create: `docs/archive/architecture/telegram-managed-bots-assessment.md`
- Create: `docs/archive/architecture/telegram-managed-bots-integration-boundary.md`

- [ ] Verify Telegram Managed Bots from official Telegram documentation before final wording.
- [ ] Document positive impact, risk areas, security concerns, and how Tempot can benefit.
- [ ] Define the future adapter boundary, token ownership model, consent model, bot provisioning workflow, and audit logging requirements.
- [ ] Keep implementation deferred until the boundary governance and current bot core are stable.

## Phase 7: Template Usability

**Files:**

- Create: `docs/archive/developer/template-usability-roadmap.md`
- Create: `docs/archive/developer/new-module-checklist.md`
- Create: `docs/archive/developer/documentation-cleanup-plan.md`

- [ ] Document future scaffolding goals for packages, modules, apps, and tests.
- [ ] Define a new module checklist aligned with SpecKit, Superpowers, module-registry, package exports, i18n, and tests.
- [ ] Identify stale documentation, duplicated methodology docs, and cleanup actions.
- [ ] Keep docs cleanup separate from production code changes.

## Phase 8: Roadmap and Validation

**Files:**

- Modify: `docs/archive/ROADMAP.md`

- [ ] Add the architecture hardening track as the active roadmap item.
- [ ] Add SaaS readiness as a future productization track, not an immediate rewrite.
- [ ] Add Telegram Managed Bots as a monitored optional capability.
- [ ] Run `pnpm spec:validate`.
- [ ] Run `git diff --check`.
- [ ] Request review before any merge to `main`.

## Completion Criteria

- Spec #026 has `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`, and `tasks.md`.
- The Superpowers execution plan exists under `docs/archive/superpowers/plans/`.
- Roadmap reflects architecture hardening before the next business module.
- No production code changed during this planning phase.
- `pnpm spec:validate` reports zero CRITICAL issues.
