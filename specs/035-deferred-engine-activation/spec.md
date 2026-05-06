# Feature Specification: Deferred Engine Activation

**Feature Branch**: `codex/035-activate-deferred-packages`
**Created**: 2026-05-06
**Status**: Draft
**Input**: Product Manager decision to build `search-engine`, `document-engine`, and
`import-engine` using the project methodology and roadmap.

## User Scenarios & Testing

### User Story 1 - Activate the selected deferred engines (Priority: P1)

As the Product Manager, I want the selected deferred packages to be activated in the
roadmap so the team can build them without violating Rule XC.

**Why this priority**: Deferred packages are exempt from blocking validation until an
activation decision is recorded. Implementation cannot start until the decision is
documented.

**Independent Test**: The roadmap records `search-engine`, `document-engine`, and
`import-engine` as activated while leaving `cms-engine` deferred.

**Acceptance Scenarios**:

1. **Given** the activation decision, **When** the roadmap is reviewed, **Then** the
   selected packages are listed in an active execution sequence.
2. **Given** `cms-engine` was not selected, **When** the roadmap is reviewed, **Then**
   it remains deferred under Rule XC.

---

### User Story 2 - Preserve one-package execution discipline (Priority: P1)

As a Technical Advisor, I want the package build order documented so implementation can
proceed one package at a time under Rule LXXXV.

**Why this priority**: The constitution allows multiple packages to be specified in
parallel but only one package may be in active execution at a time.

**Independent Test**: The activation tasks define a single ordered package sequence and
require a new implementation branch or worktree for each package.

**Acceptance Scenarios**:

1. **Given** all three packages are activated, **When** execution starts, **Then**
   `document-engine` is implemented first.
2. **Given** `document-engine` completes its merge gate, **When** the next package is
   started, **Then** `import-engine` may begin because it depends on document export
   contracts for error reports.
3. **Given** `import-engine` completes its merge gate, **When** the final package is
   started, **Then** `search-engine` may begin with the current AI and RAG contracts.

---

### User Story 3 - Repair package specifications before code (Priority: P1)

As an Executor, I want complete SpecKit artifacts for each activated package so
implementation starts from a validated handoff instead of old forward-design notes.

**Why this priority**: The existing package specs predate the current constitution and
are missing required handoff artifacts.

**Independent Test**: Each activated package has `spec.md`, `plan.md`, `research.md`,
`data-model.md`, and `tasks.md`, with no `[NEEDS CLARIFICATION]` markers and no critical
`spec:validate` issues.

**Acceptance Scenarios**:

1. **Given** an activated package, **When** its spec directory is inspected, **Then** all
   required handoff artifacts exist.
2. **Given** package tasks are generated, **When** FR and SC identifiers are checked,
   **Then** every identifier from the spec is referenced by at least one task.
3. **Given** implementation is requested, **When** the package handoff gate has not
   passed, **Then** no production code is written for that package.

## Edge Cases

- `import-engine` must not start before `document-engine` because it requires document
  export contracts for error report generation.
- `search-engine` semantic search must align with the completed `ai-core` RAG contracts
  and must not create a second AI provider path.
- `cms-engine` remains deferred because it was not part of the Product Manager decision.
- `.understand-anything/` remains a local, untracked analysis cache unless a separate DX
  tooling spec approves integration.
- If a package requires a new third-party dependency, the dependency decision must be
  captured in that package research and validated before implementation.

## Requirements

### Functional Requirements

- **FR-001**: The roadmap MUST record the Product Manager decision dated 2026-05-06 to
  activate `search-engine`, `document-engine`, and `import-engine`.
- **FR-002**: The roadmap MUST keep `cms-engine` deferred under Rule XC.
- **FR-003**: The activation plan MUST define the execution order as
  `document-engine`, then `import-engine`, then `search-engine`.
- **FR-004**: The activation plan MUST state that only one activated package may be in
  active execution at a time.
- **FR-005**: Each activated package MUST have complete SpecKit handoff artifacts before
  production implementation starts.
- **FR-006**: Each activated package MUST pass cross-artifact analysis with zero critical
  findings before implementation starts.
- **FR-007**: Each activated package MUST run package-relevant gates and full merge gates
  before it is merged.
- **FR-008**: The activation branch MUST avoid production package code changes except
  documentation and SpecKit repair.
- **FR-009**: The activation plan MUST leave `.understand-anything/` untracked and outside
  CI, scripts, and package dependencies.

### Key Entities

- **PackageActivationDecision**: The dated roadmap decision that moves selected packages
  out of Rule XC deferral.
- **PackageExecutionSequence**: The ordered list that enforces one package in active
  execution at a time.
- **PackageHandoffGate**: The artifact and validation state required before package code
  implementation.

## Success Criteria

- **SC-001**: Roadmap review shows the three selected packages activated and `cms-engine`
  still deferred.
- **SC-002**: `specs/014-search-engine-package`, `specs/016-document-engine-package`,
  and `specs/017-import-engine-package` each contain the required SpecKit handoff
  artifacts.
- **SC-003**: `corepack pnpm spec:validate` reports zero critical issues for activated
  package specs.
- **SC-004**: No package source code is changed by this activation slice.
- **SC-005**: The next executable roadmap item is `document-engine` implementation in a
  separate isolated branch or worktree.

## Assumptions

- The Product Manager decision in this conversation is the activation authority for these
  three packages.
- The activation branch prepares governance and handoff artifacts only; package code
  implementation happens on subsequent package-specific branches.
- The project will keep `cms-engine` deferred until a separate Product Manager decision.
