# Tasks: Bot Developer Runtime Observability

## Phase 1: Methodology Artifacts

- [x] Create SpecKit artifacts for the feature.
- [x] Create Superpowers design document.
- [x] Create Superpowers implementation plan.

## Phase 2: Bot Interaction Observability

- [x] Add failing tests for interaction observer middleware. Covers FR-003 and FR-007.
- [x] Implement interaction observer middleware. Covers FR-003 and FR-007.
- [x] Add failing tests for callback fallback middleware. Covers FR-004 and FR-006.
- [x] Implement callback fallback middleware with i18n keys. Covers FR-004 and FR-006.
- [x] Register observer and fallback in the bot runtime. Covers FR-003, FR-004, and FR-007.
- [x] Add callback namespace pass-through regression tests and implementation for module handlers. Covers FR-010.

## Phase 3: Input Flow Observability

- [x] Add failing tests for field lifecycle logging. Covers FR-005.
- [x] Add field start, validation failure, cancel, back, success, and max retry logs. Covers FR-005.
- [x] Add replay-safe best-effort callback acknowledgement timeout tests and implementation. Covers FR-008.
- [x] Add regression coverage ensuring conversational callback acknowledgements avoid `conversation.external` replay wrapping. Covers FR-008.

## Phase 4: Development Runtime

- [x] Add the root development command using existing tooling. Covers FR-001 and FR-002.
- [x] Document usage and limitations. Covers FR-001 and FR-002.
- [x] Add non-blocking startup event publishing tests and implementation. Covers FR-009.

## Phase 5: Verification

- [x] Run targeted bot-server tests.
- [x] Run targeted input-engine tests.
- [x] Run targeted builds.
- [x] Run lint or document any existing blockers.
