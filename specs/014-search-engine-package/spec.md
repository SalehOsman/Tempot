# Feature Specification: Search Engine Package

**Feature Branch**: `014-search-engine-package`
**Created**: 2026-03-19
**Repaired**: 2026-05-06
**Status**: Active SpecKit Handoff
**Input**: Activate `search-engine` after the Product Manager decision to build
`search-engine`, `document-engine`, and `import-engine`.

## User Scenarios & Testing

### User Story 1 - Typed relational search planning (Priority: P1)

As a module developer, I want a typed search request model that validates filters,
pagination, sorting, and exact text search so repositories can execute consistent list
queries without duplicating search logic.

**Why this priority**: Relational list search is required by data-heavy modules and does
not require AI, vectors, or new user interface coupling.

**Independent Test**: A unit test submits valid and invalid filter requests and asserts
that the engine returns typed search plans or `AppError` values through `Result`.

**Acceptance Scenarios**:

1. **Given** enum, range, date range, contains, and boolean filters, **When** a request is
   validated, **Then** the engine returns a normalized relational search plan.
2. **Given** an unsupported field or invalid operator, **When** a request is validated,
   **Then** the engine returns a typed `AppError` and no query plan.
3. **Given** a valid page request, **When** the plan is built, **Then** the pagination
   metadata contains page, page size, offset, limit, and result count placeholders.

---

### User Story 2 - Search state persistence (Priority: P1)

As a bot workflow, I want search state snapshots stored with a bounded TTL so pagination
and filter edits can resume without leaking stale state.

**Why this priority**: Telegram list flows rely on message edits and state restoration
between callback interactions.

**Independent Test**: A unit test uses a fake cache adapter and verifies that state is
stored and loaded through package abstractions with the configured TTL.

**Acceptance Scenarios**:

1. **Given** a search state, **When** it is saved, **Then** the cache adapter receives a
   namespaced key and a 30-minute TTL.
2. **Given** an expired or missing state, **When** it is loaded, **Then** the engine
   returns a typed expired-state error.

---

### User Story 3 - Semantic search planning (Priority: P2)

As a module developer, I want semantic search requests to be planned through the current
`ai-core` retrieval contracts so smart search does not create a separate AI path.

**Why this priority**: Smart search is valuable, but it must align with the RAG work
already completed in `ai-core`.

**Independent Test**: A unit test uses fake semantic adapters and verifies that semantic
requests require a query, produce relevance metadata, and do not call external providers
directly.

**Acceptance Scenarios**:

1. **Given** `searchMode` is `semantic` and a query is present, **When** the plan is built,
   **Then** the engine delegates embedding/retrieval work through injected adapters.
2. **Given** `searchMode` is `semantic` and the query is empty, **When** validation runs,
   **Then** the engine returns a typed validation error.

## Edge Cases

- Empty results return structured empty-state metadata with i18n message keys.
- State expiry returns an i18n message key and does not reuse stale filters.
- Search requests must reject unsupported fields before any repository execution.
- Semantic search must not call AI providers directly from `search-engine`.
- Services and handlers must not access Prisma directly; repositories or injected
  adapters own persistence execution.
- UI text must be represented by i18n keys, not hardcoded strings.

## Requirements

### Functional Requirements

- **FR-001**: The package MUST define strict typed contracts for search requests, filters,
  sorting, pagination, state snapshots, and result metadata.
- **FR-002**: The package MUST support enum, range, date range, contains, and boolean
  filter categories.
- **FR-003**: Fallible public APIs MUST return `Result<T, AppError>` or async Result
  equivalents.
- **FR-004**: The package MUST validate allowed searchable fields before building a plan.
- **FR-005**: The package MUST build relational search plans without directly executing
  Prisma clients or database calls.
- **FR-006**: The package MUST persist and restore search state through an injected cache
  adapter with a 30-minute TTL.
- **FR-007**: The package MUST expose pagination metadata that supports message-edit list
  flows.
- **FR-008**: Semantic search MUST use injected `ai-core` or retrieval adapters and MUST
  avoid direct provider calls.
- **FR-009**: Empty, expired, and invalid-search states MUST use i18n message keys.
- **FR-010**: The implementation MUST satisfy the package creation checklist before code
  is considered complete.

### Key Entities

- **SearchRequest**: The input containing query, mode, filters, sort, pagination, and
  authorized searchable fields.
- **SearchFilterDefinition**: The configured field and allowed operator metadata.
- **SearchPlan**: The normalized relational or semantic plan consumed by repositories or
  adapters.
- **SearchStateSnapshot**: The cached state used to restore pagination and filter flows.
- **SearchResultPage**: The result metadata shape returned to callers after execution by
  their repository or adapter.

## Success Criteria

- **SC-001**: Unit tests cover all five required filter categories.
- **SC-002**: Invalid field and invalid operator requests return typed errors without
  producing a plan.
- **SC-003**: State persistence tests prove the 30-minute TTL behavior.
- **SC-004**: Semantic search tests prove provider calls are adapter-driven, not direct.
- **SC-005**: Package checklist, lint, build, unit tests, and `spec:validate` pass before
  merge.

## Assumptions

- Repository packages or modules execute persistence queries; `search-engine` plans and
  validates search behavior.
- Semantic search MVP is adapter-driven and may be implemented after relational search in
  the same package branch if the TDD gate remains intact.
