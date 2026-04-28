# Feature Specification: Architecture Isolation and SaaS Readiness

**Feature Branch**: `026-architecture-isolation-and-saas-readiness`
**Created**: 2026-04-28
**Status**: Draft
**Input**: User description: "Improve Tempot so it remains a professional, well-isolated bot framework while preparing it to become the core of a future SaaS platform, taking Telegram Managed Bots and other new Telegram bot platform capabilities into account."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Protect Architectural Boundaries (Priority: P1)

As the project owner, I want every package, app, and module boundary to be explicit and automatically checkable so future development can stay localized to the intended component.

**Why this priority**: This is the foundation for all later work. SaaS readiness and Telegram Managed Bots will increase complexity; weak boundaries would make every later feature harder and riskier.

**Independent Test**: A reviewer can inspect the generated boundary inventory and enforcement plan and determine which dependencies are allowed, prohibited, or need remediation without reading every source file manually.

**Acceptance Scenarios**:

1. **Given** the current project structure, **When** the boundary audit is completed, **Then** each app, package, and module has a documented responsibility and allowed dependency direction.
2. **Given** an import path that bypasses a package public contract, **When** the boundary rules are evaluated, **Then** the violation is reported with the owning source and target component.
3. **Given** a module that directly imports another module, **When** the boundary rules are evaluated, **Then** the dependency is reported as prohibited unless it is explicitly documented as a temporary remediation item.

---

### User Story 2 - Make Tempot Core SaaS-Ready (Priority: P2)

As the project owner, I want Tempot Core to remain usable as a standalone bot framework while documenting the minimum architectural changes needed for a future hosted SaaS product.

**Why this priority**: The project should not pivot prematurely into SaaS, but it must avoid decisions that would block a future Tempot Cloud product.

**Independent Test**: A reviewer can follow the SaaS readiness model and identify where tenant, workspace, bot, ownership, settings, audit, and token concerns belong without requiring immediate SaaS implementation.

**Acceptance Scenarios**:

1. **Given** a future hosted product scenario, **When** the SaaS readiness model is reviewed, **Then** it distinguishes Tempot Core responsibilities from future Tempot Cloud responsibilities.
2. **Given** a future multi-bot customer account, **When** ownership and scope requirements are reviewed, **Then** the model defines how tenant, bot, user, settings, and audit scopes should be represented.
3. **Given** an existing module, **When** the SaaS readiness checklist is applied, **Then** the reviewer can tell whether the module is safe for single-bot use only, bot-scoped use, or future tenant-scoped use.

---

### User Story 3 - Evaluate Telegram Managed Bots Strategically (Priority: P3)

As the project owner, I want the new Telegram Managed Bots capability to be assessed as a formal product opportunity so Tempot can benefit from it without disrupting the current methodology.

**Why this priority**: Telegram Managed Bots may become a strong differentiator for Tempot, but it should be integrated only after the core boundaries are stable.

**Independent Test**: A reviewer can read the Telegram capability assessment and decide whether to continue the current plan, defer the feature, or start a later managed-bot platform feature without guessing its impact.

**Acceptance Scenarios**:

1. **Given** Telegram's Managed Bots feature, **When** the product impact is reviewed, **Then** the assessment states whether it is positive, negative, or neutral for Tempot and why.
2. **Given** Tempot's current roadmap, **When** the Managed Bots opportunity is reviewed, **Then** the next-step recommendation preserves the current architecture-hardening path before implementation.
3. **Given** a future managed-bot module, **When** its boundary is reviewed, **Then** it is treated as an optional module/package with explicit security and ownership requirements, not a direct modification to unrelated modules.

---

### User Story 4 - Improve Template Usability (Priority: P4)

As a future Tempot adopter, I want the project to provide clear setup, module creation, validation, and examples so it is easier to use as a professional template.

**Why this priority**: Developer experience determines adoption. It can be improved after boundaries and strategic direction are documented.

**Independent Test**: A new contributor can follow the documented quickstart and readiness checklist to understand how to create or evaluate a module without relying on private project knowledge.

**Acceptance Scenarios**:

1. **Given** a new developer, **When** they read the usability roadmap, **Then** they can identify the intended CLI, module generator, doctor command, examples, and documentation improvements.
2. **Given** a new module proposal, **When** the quality checklist is applied, **Then** it covers specification, boundaries, tests, i18n, observability, and documentation readiness.

---

### User Story 5 - Close Review Findings and Define Professional Baselines (Priority: P2)

As the project owner, I want known review findings and quality proposals to be explicitly mapped into the plan so future execution does not depend on implicit interpretation.

**Why this priority**: Review findings contain concrete governance, security, i18n, and package hygiene gaps. They must be tracked beside the broader architecture plan before production code changes begin.

**Independent Test**: A reviewer can inspect the review-findings remediation plan and confirm that each known finding and each approved quality proposal has an owner artifact, execution task, and validation path.

**Acceptance Scenarios**:

1. **Given** the current review findings, **When** the remediation plan is reviewed, **Then** each finding is mapped to a specific document or future implementation task.
2. **Given** the approved DX proposals, **When** the template usability roadmap is reviewed, **Then** it explicitly names the official CLI, module generator, developer doctor, marketplace, and quick-path documentation.
3. **Given** the approved security and observability proposals, **When** the architecture plan is reviewed, **Then** it includes secret scanning, dependency review, token rotation guidance, and observability dashboard planning.

### Edge Cases

- A package may be intentionally shared infrastructure. The boundary model must distinguish shared dependencies from accidental coupling.
- A future SaaS feature may require global changes. The plan must allow documented contract changes while preventing undocumented cross-cutting edits.
- Telegram capabilities may change again. The feature must record the current assessment as a dated decision and keep future Telegram platform changes as separate research items.
- Documentation-only planning must not be mistaken for production implementation readiness. The Handoff Gate still requires tasks, analysis, validation, and owner approval.
- Review findings may already be partially fixed on main. The plan must distinguish completed findings from remaining enforcement or documentation work.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The feature MUST define a project-wide boundary model covering apps, packages, modules, generated documentation, and shared tooling.
- **FR-002**: The feature MUST define allowed and prohibited dependency directions for apps, packages, and modules.
- **FR-003**: The feature MUST define how violations such as direct module-to-module imports, deep package imports, circular dependencies, and shared-code blast radius issues are identified.
- **FR-004**: The feature MUST define a staged remediation plan that improves boundaries without large unrelated rewrites.
- **FR-005**: The feature MUST define Tempot Core and Tempot Cloud as separate product layers with clear responsibility boundaries.
- **FR-006**: The feature MUST define SaaS readiness concepts for tenant, workspace, bot, user, ownership, scoped settings, audit context, token handling, and usage limits.
- **FR-007**: The feature MUST state that Tempot Core remains the current implementation priority and that Tempot Cloud is a future product track unless separately approved.
- **FR-008**: The feature MUST assess Telegram Managed Bots as a dated product opportunity and identify the recommended integration timing.
- **FR-009**: The feature MUST define how Telegram Managed Bots should be introduced later without bypassing existing SpecKit, Superpowers, security, i18n, and module boundary rules.
- **FR-010**: The feature MUST propose template usability improvements, including setup diagnostics, module generation, examples, and contributor-facing guidance.
- **FR-011**: The feature MUST include validation tasks for CI and governance gates so architectural drift can be detected before merge.
- **FR-012**: The feature MUST update roadmap-level planning artifacts to reflect architecture isolation, SaaS readiness, and Telegram Managed Bots as approved strategic tracks.
- **FR-013**: The feature MUST explicitly evaluate an official Tempot CLI entrypoint such as `create-tempot-bot` or `pnpm tempot init`.
- **FR-014**: The feature MUST define a governed module generator that creates module source, tests, i18n resources, events, and contracts.
- **FR-015**: The feature MUST define a local developer doctor that checks Node.js, pnpm, Docker, environment variables, database connectivity, and Redis connectivity.
- **FR-016**: The feature MUST define the future admin dashboard scope for modules, settings, users, and bots without forcing immediate SaaS implementation.
- **FR-017**: The feature MUST define a future internal template marketplace for activatable bot feature templates.
- **FR-018**: The feature MUST define a future observability dashboard scope for logs, audit events, errors, queues, and sessions.
- **FR-019**: The feature MUST define a stronger security baseline covering secret scanning, dependency review, and token rotation guidance.
- **FR-020**: The feature MUST define a "quick path" documentation target for building the first real module in about 15 minutes.
- **FR-021**: The feature MUST explicitly track remediation for known review findings covering spec validation, roadmap drift, non-blocking security audit, hardcoded user-facing text, and module package checklist gaps.

### Key Entities

- **Boundary Component**: An app, package, module, generated documentation surface, or shared tooling unit with a defined responsibility and dependency allowance.
- **Boundary Rule**: A statement that defines allowed, restricted, or prohibited relationships between component types.
- **Violation Finding**: A documented case where the current project structure does not match the desired boundary model.
- **Remediation Item**: A scoped change that resolves one or more violation findings with measurable acceptance criteria.
- **Tempot Core**: The current framework and runtime layer intended to remain usable without a hosted SaaS product.
- **Tempot Cloud**: A future hosted product layer built on top of Tempot Core.
- **Tenant Scope**: A future ownership boundary for SaaS customers, organizations, or workspaces.
- **Bot Scope**: A runtime boundary representing one Telegram bot instance or managed bot.
- **Telegram Managed Bot Opportunity**: A dated assessment of Telegram's capability for manager bots to create and manage other bots.
- **Developer Tooling Surface**: Future CLI, generator, doctor, and quick-path documentation used to make Tempot easier to adopt.
- **Security Baseline**: A documented set of security gates and operational guides required before expanding SaaS or managed-bot functionality.
- **Review Finding**: A concrete issue from project review that must be classified as resolved, planned, or deferred with rationale.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of active apps, packages, and modules are represented in the boundary inventory with an owner responsibility and dependency classification.
- **SC-002**: The plan identifies zero unresolved critical ambiguity around whether Tempot should continue, pivot, or stop; the recommendation is explicit.
- **SC-003**: At least 90% of proposed tasks are scoped to documentation, analysis, or enforcement and do not require feature rewrites before the project owner approves implementation.
- **SC-004**: The resulting task list separates the MVP boundary-hardening work from later SaaS and Telegram Managed Bots work.
- **SC-005**: A future contributor can use the quickstart to run the planned validation gates and understand the expected pass/fail outcomes in under 15 minutes.
- **SC-006**: SpecKit validation reports zero critical issues for this active feature before implementation begins.
- **SC-007**: All approved DX proposals are explicitly represented in tasks or roadmap-linked documents.
- **SC-008**: All known review findings are explicitly represented in remediation tasks with validation expectations.

## Assumptions

- The current project continues as Tempot Core; the SaaS product track is future-facing and must not disrupt the current bot framework work.
- Telegram Managed Bots are strategically useful but should be introduced after architecture isolation hardening unless the project owner explicitly reprioritizes.
- This feature starts with planning, documentation, and governance artifacts; production code changes require a later approved execution plan.
- GitHub Actions and branch protection improvements are part of the governance track because they enforce correct merges.
- The active implementation platform remains the current TypeScript monorepo with Node.js 22.12+ and the existing SpecKit + Superpowers methodology.
