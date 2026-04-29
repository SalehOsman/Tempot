# Feature Specification: AI Core RAG Reconciliation

**Feature Branch**: `028-ai-core-rag-reconciliation`
**Created**: 2026-04-29
**Status**: Approved for execution
**Input**: Execute the first implementation slice from Spec #027 by reconciling the existing `ai-core` package with the approved RAG methodology.

## User Scenarios & Testing

### User Story 1 - Maintainer trusts the ai-core source of truth (Priority: P1)

The maintainer needs the implemented `ai-core` package, README, and historical SpecKit artifacts to describe the same current behavior before new RAG packages are activated.

**Why this priority**: Spec #027 depends on the current AI foundation being clean and accurate. Building new RAG layers on stale provider or task guidance would compound architecture drift.

**Independent Test**: A reviewer can compare `packages/ai-core/README.md`, `specs/015-ai-core-package/spec.md`, and `specs/015-ai-core-package/tasks.md` without finding stale provider variables, removed error codes, or unfinished task guidance for already completed work.

**Acceptance Scenarios**:

1. **Given** a developer follows the ai-core README, **When** they configure provider switching, **Then** they use the implemented `TEMPOT_AI_PROVIDER` variable.
2. **Given** an agent reads the ai-core SpecKit task file, **When** it plans follow-up work, **Then** it sees a reconciled implementation state instead of obsolete unchecked scaffolding tasks.

---

### User Story 2 - Bot UI owns user-facing confirmation text (Priority: P1)

The bot runtime needs `IntentRouter` to return structured confirmation state without embedding English user-facing text inside package source.

**Why this priority**: Constitution Rule XXXIX requires all user-visible text to flow through i18n keys. `IntentRouter` currently returns English confirmation text from TypeScript.

**Independent Test**: Unit tests prove confirmation routing returns a stable translation key and machine-readable tool status while preserving confirmation metadata.

**Acceptance Scenarios**:

1. **Given** a tool requires confirmation, **When** `IntentRouter.route()` returns, **Then** `response` is an i18n key rather than an English sentence.
2. **Given** the AI SDK tool callback creates a pending confirmation, **When** the callback returns to the agent loop, **Then** it returns structured JSON status rather than English prose.

---

### User Story 3 - RAG implementation starts from a clean baseline (Priority: P2)

The architecture owner needs the roadmap and Spec #027 handoff to show that ai-core reconciliation is the active first build step before deferred RAG packages are activated.

**Why this priority**: This keeps package activation incremental and prevents `search-engine`, `document-engine`, or `import-engine` from being treated as active before their own specs.

**Independent Test**: `docs/archive/ROADMAP.md` and Spec #027 task state identify this reconciliation as the current execution slice and keep deferred packages deferred.

**Acceptance Scenarios**:

1. **Given** a maintainer reads the roadmap, **When** they inspect active AI work, **Then** the next step is ai-core reconciliation, not a new package activation.
2. **Given** a reviewer validates Spec #027, **When** they inspect final handoff tasks, **Then** the follow-on implementation spec is represented by this feature.

### Edge Cases

- Confirmation creation may fail; existing behavior remains unchanged unless a confirmation is successfully created.
- AI SDK generation may continue after a tool callback reports confirmation required; the router must still return the pending confirmation state.
- Documentation reconciliation must not reintroduce obsolete `PROVIDER_REFUSAL` or `AIDegradationMode` requirements as active work.
- Deferred package references remain roadmap-level planning only.

## Requirements

### Functional Requirements

- **FR-001**: The ai-core README MUST document `TEMPOT_AI_PROVIDER` as the provider switch and MUST NOT document `AI_PROVIDER` as an active variable.
- **FR-002**: The ai-core spec MUST supersede the stale provider refusal edge case that references `ai-core.provider.refusal`.
- **FR-003**: The ai-core tasks artifact MUST no longer present the completed package as hundreds of unchecked implementation tasks.
- **FR-004**: `IntentRouter.route()` MUST return an i18n response key when a confirmation is required.
- **FR-005**: The AI SDK tool callback MUST return machine-readable confirmation status instead of English prose when it creates a pending confirmation.
- **FR-006**: Existing confirmation metadata MUST remain available through `requiresConfirmation`.
- **FR-007**: The roadmap MUST identify this feature as the active execution slice for Spec #027.
- **FR-008**: The change MUST preserve existing package boundaries and avoid activating deferred packages.
- **FR-009**: Verification MUST include ai-core unit tests, spec validation, lint, and whitespace checks.

### Key Entities

- **AIProviderConfiguration**: Environment-driven provider selection documented by README and implemented in `ai-core.config.ts`.
- **ConfirmationResponseKey**: Stable i18n key returned by `IntentRouter` for UI translation.
- **ConfirmationToolStatus**: Structured JSON status returned to the AI SDK tool loop when execution is paused for confirmation.
- **ReconciliationArtifact**: Updated SpecKit and roadmap documentation that reflects implemented ai-core behavior.

## Success Criteria

### Measurable Outcomes

- **SC-001**: `pnpm --filter @tempot/ai-core test` passes with confirmation behavior covered.
- **SC-002**: `pnpm spec:validate` reports zero CRITICAL issues.
- **SC-003**: `pnpm lint` completes successfully.
- **SC-004**: `git diff --check` reports no whitespace errors.
- **SC-005**: README and SpecKit search results show no active `AI_PROVIDER`, `PROVIDER_REFUSAL`, or `AIDegradationMode` guidance for ai-core runtime behavior.

## Assumptions

- This feature does not implement a new RAG runtime or activate deferred packages.
- Existing `IntentResult.response` remains a string, but confirmation responses use an i18n key string.
- Bot-facing translation lookup is owned by the UI layer, not by `IntentRouter`.
