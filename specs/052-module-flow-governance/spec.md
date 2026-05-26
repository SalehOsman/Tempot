# Feature Specification: Module Flow Governance

**Feature Branch**: `codex/052-module-flow-governance`  
**Created**: 2026-05-26  
**Status**: Draft  
**Input**: User description: "Create a professional module error discovery system, flow diagrams that prevent repeated and random Telegram module interactions, package reuse governance for generated modules, and an AI-assisted module builder aligned with the Tempot methodology."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Detect Module Flow Defects Early (Priority: P1)

A developer or reviewer runs module readiness checks and receives clear findings for broken, duplicated, or unsafe module interaction flows before the issue reaches manual Telegram testing or CI.

**Why this priority**: The current callback issues were discovered after module behavior existed. Early detection prevents repeated self-navigation, missing handlers, stale buttons, and inconsistent flow ownership from spreading across modules.

**Independent Test**: Can be fully tested by introducing a module flow with a visible callback that has no valid handler and confirming the readiness report identifies the exact module, callback, surface, and required correction.

**Acceptance Scenarios**:

1. **Given** a module renders a visible callback with no owning handler, **When** the module readiness check runs, **Then** the report identifies the callback, owning surface, module, and severity.
2. **Given** a leaf page renders the same callback that opened it without a real state-changing action, **When** the module readiness check runs, **Then** the report flags repeated self-navigation as a defect.
3. **Given** a module declares an unsupported action as intentionally unavailable, **When** the readiness check runs, **Then** the report accepts it only if the user receives a clear localized unavailable response.

---

### User Story 2 - Review Module Flows With Stable Diagrams (Priority: P1)

A Project Manager, Technical Advisor, or Executor can inspect a module flow diagram that shows entry points, callback transitions, parent and leaf pages, unavailable actions, and exit paths before implementation begins.

**Why this priority**: Flow diagrams make module navigation auditable and prevent random button arrangements, repeated callbacks, and unclear ownership.

**Independent Test**: Can be fully tested by reviewing a generated or documented flow map for one active module and confirming every visible action has a target, every leaf has a return path, and no path loops to itself unintentionally.

**Acceptance Scenarios**:

1. **Given** a module has command and callback entry points, **When** its flow diagram is reviewed, **Then** all user-visible surfaces and transitions are represented.
2. **Given** a flow contains a parent page and a leaf page, **When** the diagram is reviewed, **Then** the parent shows child actions and the leaf shows return actions without repeating the selected callback.
3. **Given** a module action is not implemented yet, **When** the diagram is reviewed, **Then** the action is marked unavailable or omitted, not left ambiguous.

---

### User Story 3 - Enforce Package Reuse Before Custom Module Code (Priority: P1)

A module author can identify which approved shared capability should be reused for each module need and must document any exception before writing local custom code.

**Why this priority**: Modules should own product behavior, not rebuild shared infrastructure such as input flows, Telegram UX, settings, notifications, search, imports, exports, storage, authorization, persistence, events, or AI guidance.

**Independent Test**: Can be fully tested by reviewing a module plan or manifest and confirming every material capability is classified as reuse, composition, package extension, or approved custom behavior.

**Acceptance Scenarios**:

1. **Given** a module needs a reusable capability already approved by the project, **When** the module is planned or reviewed, **Then** the module must reuse or compose that capability instead of rebuilding it locally.
2. **Given** a module proposes local custom behavior for a reusable capability, **When** the plan is reviewed, **Then** the exception must explain the capability gap, alternatives considered, required tests, and future extraction trigger.
3. **Given** a module uses multiple approved capabilities, **When** the readiness report is generated, **Then** it summarizes the selected capabilities and highlights missing or duplicated capability usage.

---

### User Story 4 - Guide Module Creation With a Grounded Assistant (Priority: P2)

A developer asks for module creation guidance and receives grounded recommendations for module type, flow shape, capability reuse, required artifacts, tests, and review prompts based only on approved project sources.

**Why this priority**: AI assistance can speed up professional module creation, but it must reinforce the Tempot methodology rather than bypassing specification, TDD, review, or validation gates.

**Independent Test**: Can be fully tested by asking the assistant a module-building question and confirming the response cites approved project sources, recommends existing capabilities where appropriate, and reports no-context when sources do not answer the question.

**Acceptance Scenarios**:

1. **Given** a developer asks how to build a Telegram-facing module, **When** the assistant responds, **Then** it recommends the correct methodology steps, flow governance expectations, package reuse review, and required tests.
2. **Given** a developer asks for guidance not covered by approved sources, **When** the assistant responds, **Then** it states that no grounded answer is available rather than inventing project authority.
3. **Given** a module has active SpecKit artifacts, **When** the assistant reviews them, **Then** it identifies missing flow, capability, i18n, test, or documentation requirements without producing production code.

---

### User Story 5 - Improve Existing Modules Incrementally (Priority: P2)

A maintainer can apply the governance standard to one existing module at a time, receive focused findings, fix the module, and verify that the module now follows the shared flow and capability rules.

**Why this priority**: Rebuilding all modules from scratch would create unnecessary risk. Incremental hardening lets Tempot improve active modules while preserving working behavior.

**Independent Test**: Can be fully tested by selecting one active module, producing its flow report, fixing reported issues, and confirming the report passes without changing unrelated modules.

**Acceptance Scenarios**:

1. **Given** an existing active module, **When** the governance checks run, **Then** findings are scoped to that module and do not require unrelated rewrites.
2. **Given** a module passes flow governance checks, **When** a developer reviews it, **Then** the module has documented entry points, callbacks, leaf pages, unavailable actions, capability usage, and tests.
3. **Given** a module fails checks, **When** the report is reviewed, **Then** each finding has a severity, affected surface, and recommended correction path.

### Edge Cases

- A callback arrives from an old Telegram message after a module has changed or been disabled.
- A visible callback belongs to the wrong module namespace.
- A module intentionally exposes a state-changing action that reuses the current page callback.
- A module has a command entry point but no inline flow.
- A module has multiple roles with different available actions.
- A module uses a shared capability indirectly through a module-specific adapter.
- A capability gap is reusable across modules and should become a shared package extension instead of local code.
- The assistant cannot find enough approved source material for a requested recommendation.
- A flow diagram becomes stale after code or spec changes.
- A readiness report includes many findings and must distinguish blockers from advisory improvements.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The project MUST define a module flow governance standard for Telegram-facing modules, including entry points, parent pages, leaf pages, action pages, unavailable actions, back paths, and main-menu exits.
- **FR-002**: The standard MUST prohibit repeated self-navigation on leaf pages unless the repeated action performs a real, documented state change.
- **FR-003**: Every visible callback action in a governed module MUST have an owning handler, an explicit unavailable response, or a documented reason it is intentionally omitted from the rendered surface.
- **FR-004**: Governed module flows MUST include a reviewable flow diagram or equivalent flow map before production implementation begins.
- **FR-005**: Flow maps MUST represent command entry points, callback namespaces, visible surfaces, transitions, unavailable actions, role-sensitive visibility, and exit paths.
- **FR-006**: The project MUST provide a readiness report that identifies flow defects with module name, surface, callback or action, severity, and correction guidance.
- **FR-007**: The readiness report MUST distinguish blocking defects from advisory improvements.
- **FR-008**: Module planning and review MUST classify every material reusable capability as reuse, composition, package extension, or approved custom behavior.
- **FR-009**: Approved custom behavior MUST include a documented exception rationale, alternatives considered, required tests, and future extraction trigger.
- **FR-010**: The governance system MUST detect when a module duplicates a shared capability that should be reused or extended.
- **FR-011**: The governance system MUST verify that user-facing labels and unavailable responses are backed by localized content in required project languages.
- **FR-012**: The governance system MUST support incremental review of one module at a time without requiring all modules to be rebuilt.
- **FR-013**: Existing active modules MUST be able to adopt the standard through focused hardening tasks rather than wholesale recreation.
- **FR-014**: New module creation guidance MUST include flow mapping, callback ownership, capability reuse, localization, testing, documentation, and validation expectations.
- **FR-015**: The grounded assistant MUST use only approved project sources when giving module creation or review guidance.
- **FR-016**: The grounded assistant MUST identify insufficient context instead of presenting unverified guidance as project authority.
- **FR-017**: The grounded assistant MUST recommend methodology gates and review prompts but MUST NOT bypass Product Manager approval, SpecKit artifacts, TDD, review, or verification gates.
- **FR-018**: The feature MUST define measurable acceptance gates for applying the standard to at least one pilot module before broad rollout.

### Key Entities _(include if feature involves data)_

- **Module Flow Map**: A reviewable representation of a module's user-visible entry points, surfaces, callback transitions, unavailable actions, role rules, and exit paths.
- **Interaction Surface**: A user-visible state such as a main module view, parent menu, leaf page, action result, confirmation, or unavailable-action response.
- **Callback Action**: A user-triggered inline action with ownership, target surface, visibility rules, and expected outcome.
- **Capability Decision**: A planning and review record that classifies a module need as reuse, composition, package extension, or approved custom behavior.
- **Custom Capability Exception**: A documented justification for local custom behavior when approved shared capabilities do not fit.
- **Readiness Finding**: A reported issue or advisory item with severity, location, evidence, and recommended correction.
- **Grounded Assistant Answer**: A module-building recommendation tied to approved source material and explicit no-context behavior when evidence is missing.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of visible callbacks in the pilot module are represented in a flow map and have a handler, unavailable response, or documented omission rule.
- **SC-002**: The pilot module readiness report detects at least one seeded missing-handler defect and one seeded repeated self-navigation defect before implementation fixes are applied.
- **SC-003**: After pilot hardening, pressing every visible pilot-module action completes with a valid module response, unavailable response, or return path during local verification.
- **SC-004**: Every material pilot-module capability is classified as reuse, composition, package extension, or approved custom behavior.
- **SC-005**: The module creation guidance reduces undocumented custom capability decisions to zero in reviewed pilot artifacts.
- **SC-006**: Grounded assistant evaluation demonstrates retrieval-backed answers for module methodology questions and explicit no-context behavior for unsupported questions.
- **SC-007**: Existing active modules can be assessed one at a time, with readiness reports generated independently for each selected module.
- **SC-008**: The Project Manager and Technical Advisor can review a module flow diagram and identify entry points, leaf pages, unavailable actions, and exits without reading implementation code.

## Assumptions

- The first implementation slice will create governance standards, checks, and a pilot adoption path rather than rebuilding every active module at once.
- Existing module fixes remain scoped to the selected pilot module until the Project Manager approves broader rollout.
- The current single-bot template remains the product priority; the governance model must stay ready for future multi-bot scope without introducing SaaS-only behavior.
- Existing package capability standards remain authoritative for package reuse decisions.
- The assistant is a developer aid and review companion, not a production runtime dependency for normal module execution.
- Flow diagrams may be stored as documentation or generated from structured module metadata, as long as they remain reviewable and validated against module behavior.
