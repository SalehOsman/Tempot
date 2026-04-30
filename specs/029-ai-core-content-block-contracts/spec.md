# Feature Specification: AI Core Content Block Contracts

**Feature Branch**: `029-ai-core-content-block-contracts`
**Created**: 2026-04-29
**Status**: Complete
**Input**: Execute the next implementation slice from Spec #027 by adding Tempot-native content block contracts to the existing `ai-core` package without activating deferred packages.

## User Scenarios & Testing

### User Story 1 - Package developers share one RAG content contract (Priority: P1)

Future packages need one exported TypeScript contract for normalized RAG content so `document-engine`, `import-engine`, modules, and `ai-core` can integrate through public shapes instead of private implementation details.

**Why this priority**: Spec #027 depends on stable content block boundaries before any future parser, importer, or search package is activated.

**Independent Test**: A unit test imports the public `ai-core` barrel and validates a complete `ContentSource` plus `ContentBlock` without importing internal files.

**Acceptance Scenarios**:

1. **Given** a future package builds a content source, **When** it imports from `@tempot/ai-core`, **Then** it can use `ContentSource` and validation helpers through the public barrel.
2. **Given** a normalized content block includes text, metadata, access policy, PII state, and embedding state, **When** it is validated, **Then** validation returns `ok(block)`.

---

### User Story 2 - Raw PII cannot be embedded by default (Priority: P1)

The AI layer must prevent raw sensitive content from entering embeddings unless an explicit policy allows it.

**Why this priority**: RAG indexing is security-sensitive. PII handling must be enforced at the contract boundary before indexing expands.

**Independent Test**: A unit test passes a block with `piiState = raw` into the embeddable validator and receives a typed `Result.err()`.

**Acceptance Scenarios**:

1. **Given** a block has raw PII, **When** embedding validation runs with default policy, **Then** it returns `ai-core.content_block.raw_pii`.
2. **Given** a block has sanitized, redacted, or no PII, **When** embedding validation runs, **Then** it can pass if all other block fields are valid.

---

### User Story 3 - Grounded answers enforce citations (Priority: P2)

RAG answers must not be marked answered without citations to authorized content blocks.

**Why this priority**: Grounding and traceability are central to Spec #027 and prevent unsupported answer claims.

**Independent Test**: A unit test validates that an `answered` grounded answer without citations returns a typed error.

**Acceptance Scenarios**:

1. **Given** a grounded answer is in `answered` state, **When** citations are empty, **Then** validation returns `ai-core.rag.grounding_invalid`.
2. **Given** a grounded answer is `no-context`, **When** it has an i18n message key and no citations, **Then** validation can pass.

## Edge Cases

- Binary-only blocks are valid only when they have a binary reference.
- Blocks with neither text nor binary reference are invalid.
- Confidence values must be between 0 and 1.
- Relationship traversal, storage, and physical indexing remain out of scope for this slice.
- Deferred packages remain deferred under Rule XC.

## Requirements

### Functional Requirements

- **FR-001**: `ai-core` MUST export public `ContentSource`, `ContentBlock`, and `GroundedAnswer` TypeScript contracts.
- **FR-002**: `ai-core` MUST export validation helpers through its public barrel.
- **FR-003**: Content source validation MUST require a stable id, kind, origin package, and access policy.
- **FR-004**: Content block validation MUST require a stable id, source id, supported block type, sequence, metadata object, access policy, extraction confidence, PII state, and embedding state.
- **FR-005**: Content block validation MUST reject blocks that contain neither text nor binary reference.
- **FR-006**: Embeddable block validation MUST reject raw PII by default with a typed `AppError`.
- **FR-007**: Grounded answer validation MUST reject answered states without citations.
- **FR-008**: Public fallible validation APIs MUST return `Result<T, AppError>`.
- **FR-009**: The change MUST not activate `search-engine`, `document-engine`, or `import-engine`.

### Key Entities

- **ContentSource**: Public source registration contract for content that can produce blocks.
- **ContentBlock**: Public normalized retrievable unit contract.
- **ContentBlockEmbeddingPolicy**: Policy controlling whether raw PII may be embedded.
- **GroundedAnswer**: Public grounded answer state with citations and i18n message keys.

## Success Criteria

- **SC-001**: Focused ai-core unit tests pass for valid source, valid block, raw PII rejection, invalid block rejection, and grounded answer citation enforcement.
- **SC-002**: `pnpm --filter @tempot/ai-core test` passes.
- **SC-003**: `pnpm lint` passes.
- **SC-004**: `pnpm spec:validate` reports zero critical issues.
- **SC-005**: `git diff --check` reports no whitespace errors.

## Assumptions

- This slice defines contracts and validation only; it does not add physical tables or indexes.
- Existing ingestion remains compatible and can adopt these contracts in a later slice.
- Access policy evaluation remains owned by authorization and retrieval layers; this slice validates that policy references exist.

## Closeout

- Completed on 2026-04-29.
- Merged to `main` in commit `7ca5538`.
- Follow-on work continues in Spec #030: `ai-core-retrieval-planning-and-grounding`.
