# Research: Architecture Isolation and SaaS Readiness

**Feature**: 026-architecture-isolation-and-saas-readiness
**Date**: 2026-04-28

## Decision 1: Continue Tempot Core Before Building Tempot Cloud

**Decision**: Continue the current Tempot Core work and treat SaaS as a future product layer called Tempot Cloud.

**Rationale**: Tempot already contains core framework capabilities such as modular packages, bot runtime, user management, settings, audit logging, i18n, AI abstraction, and documentation. These are useful both for a standalone framework and for a later SaaS. Building SaaS now would introduce multi-tenancy, billing, hosted provisioning, and dashboard scope before the core boundaries are hardened.

**Alternatives considered**:

- **Immediate SaaS pivot**: Rejected because it increases complexity before package/module isolation is guaranteed.
- **Cancel Tempot**: Rejected because Telegram's new features strengthen the value of a professional bot operating platform rather than replacing it.
- **Framework only forever**: Rejected because it misses a credible product opportunity enabled by Telegram's managed bot capabilities.

## Decision 2: Architecture Isolation Hardening Is the First Track

**Decision**: Start with a boundary audit, boundary contracts, enforcement checks, and legacy package hardening.

**Rationale**: The user's target state is local changeability: a future developer should change one package or module without touching unrelated code. This requires explicit boundaries and automated drift detection before adding higher-level SaaS or managed-bot features.

**Alternatives considered**:

- **Start with module generator**: Rejected for now because generators would reproduce current boundary gaps if they are not first defined.
- **Start with dashboard/SaaS UI**: Rejected because it would depend on tenant, bot, and ownership contracts that do not yet exist.
- **Manual review only**: Rejected because the desired quality level requires automated merge gates.

## Decision 3: Telegram Managed Bots Are a Positive Strategic Opportunity

**Decision**: Treat Telegram Managed Bots as a future optional product capability, not as a disruption to the current plan.

**Rationale**: Telegram now documents that bots can create and manage other bots on behalf of owners through Bot Management Mode. The manager receives managed bot updates and can fetch managed bot tokens. This aligns strongly with a future Tempot Cloud model where a central Tempot manager bot provisions customer bots from templates.

**Alternatives considered**:

- **Ignore Managed Bots**: Rejected because it could become a key differentiator for bot provisioning.
- **Implement immediately in bot-server**: Rejected because it would couple new Telegram lifecycle concerns into the runtime before boundaries and security model are ready.
- **Replace Tempot with no-code Telegram bot creation**: Rejected because no-code creation does not replace enterprise runtime needs such as audit, RBAC, AI governance, i18n, observability, and modular business logic.

## Decision 4: Managed Bot Capability Belongs Behind Its Own Boundary

**Decision**: Model future managed-bot functionality as a dedicated optional module/package track, with explicit token, owner, bot scope, and audit requirements.

**Rationale**: Managed bot tokens are high-risk secrets. Bot lifecycle operations must not be scattered across unrelated packages or modules. A dedicated boundary preserves separation of concerns and makes the blast radius reviewable.

**Alternatives considered**:

- **Add managed bot logic directly to bot-server**: Rejected because bot-server should remain a runtime/interface layer.
- **Add managed bot logic to settings**: Rejected because settings should configure behavior, not own bot provisioning lifecycle.
- **Add managed bot logic to user-management**: Rejected because user management owns users and roles, not external bot identities.

## Decision 5: Template Usability Should Be Built After Boundary Rules

**Decision**: Plan CLI, module generator, doctor command, examples, and quickstart improvements after boundary contracts are documented.

**Rationale**: A template becomes easy to use when the correct path is generated and validated automatically. Those tools should encode the final architecture standard, not the current transitional state.

**Alternatives considered**:

- **Create CLI immediately**: Rejected until target file layout and validation rules are stable.
- **Documentation only**: Rejected because a professional template needs executable validation and generation support.
- **Examples without generator**: Deferred because examples should be based on the final module standard.

## Decision 6: Governance and CI Are Part of Architecture Quality

**Decision**: Add future CI and branch protection tasks to enforce boundaries, spec validation, Docker build, security audit at moderate level, and required status checks.

**Rationale**: Correct code cannot be guaranteed by convention alone. The project needs automated gates that prevent accidental drift and direct unsafe merges.

**Alternatives considered**:

- **Rely on local checks only**: Rejected because local checks are easy to skip.
- **Full build only**: Rejected because build success does not prove boundaries, specification parity, or security posture.
- **Manual merge discipline only**: Rejected because the project goal is professional repeatability.

## Decision 7: Developer Tooling Must Be Planned as First-Class Architecture

**Decision**: Treat the official CLI, governed module generator, local developer doctor, internal template marketplace, and 15-minute first-module guide as first-class roadmap items.

**Rationale**: Tempot should be usable as a professional template, not just a codebase. These tools reduce onboarding friction while encoding the project rules for tests, i18n, events, contracts, exports, and validation.

**Alternatives considered**:

- **Documentation-only onboarding**: Rejected because contributors can still create inconsistent modules manually.
- **Generator before boundary hardening**: Rejected because it would automate the wrong structure if boundaries are not finalized first.
- **Ad hoc scripts**: Rejected because the project needs a stable public developer surface.

## Decision 8: Security and Observability Baselines Must Precede SaaS Expansion

**Decision**: Define security and observability baselines before implementing Tempot Cloud or Telegram Managed Bots.

**Rationale**: SaaS and managed-bot capabilities increase token, tenant, audit, and operational risk. Secret scanning, dependency review, token rotation guidance, and observability dashboards are prerequisites for safe expansion.

**Alternatives considered**:

- **Delay security baseline until SaaS implementation**: Rejected because it would allow risky architectural choices to become embedded.
- **Rely only on package audit**: Rejected because audit does not cover secret leaks, token rotation, operational visibility, or review policy.
- **Build observability later without a plan**: Rejected because observability surfaces affect logging, audit, queue, session, and error contracts.
