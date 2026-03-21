# Feature Specification: Search Engine (Relational & Semantic)

**Feature Branch**: `014-search-engine-package`  
**Created**: 2026-03-19  
**Status**: Draft  
**Input**: User description: "Establish the functional search-engine package for advanced filtering and semantic search as per Tempot v11 Blueprint."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Advanced Filtering (Priority: P1)

As a user, I want to filter lists (e.g., invoices, users) by multiple criteria (date, status, amount) so that I can find exactly what I'm looking for quickly.

**Why this priority**: Core requirement for any data-heavy application (Section 13.9).

**Independent Test**: Applying a complex filter (e.g., `status=PAID AND amount > 1000`) and verifying the results match the DB records.

**Acceptance Scenarios**:

1. **Given** a dataset of 1,000 records, **When** I apply a combined filter via the bot menu, **Then** the search-engine builds a Prisma `where` condition and returns the correct subset.
2. **Given** a filtered list, **When** I navigate to page 2, **Then** the filters are preserved via the `cache-manager` state.

---

### User Story 2 - Semantic "Smart" Search (Priority: P2)

As a user, I want to search for items using natural language (e.g., "show me high-value bills from last month") so that I don't have to navigate complex filter menus.

**Why this priority**: Differentiates the bot as a "Smart Bot" leveraging AI core capabilities (ADR-016).

**Independent Test**: Sending a natural language query and verifying it returns semantically relevant results from the vector database.

**Acceptance Scenarios**:

1. **Given** a query "unpaid invoices", **When** `searchMode` is `semantic`, **Then** the engine uses `ai-core` embeddings and `pgvector` to find relevant records even if the word "unpaid" isn't exactly in the title.
2. **Given** a semantic search result, **When** displayed to the user, **Then** it shows a "Relevance Score" or similar indicator.

---

## Edge Cases

- **Empty Results**: How to handle zero matches gracefully? (Answer: Show a helpful i18n message with a "Clear Filters" button).
- **State Expiry**: User returns to a search menu after 2 days (Answer: Search state in Redis expires after 30 minutes; show a "Session Expired" message as per Rule LXIX).
- **SQL Injection**: Preventing malicious filter strings (Answer: Prisma ORM automatically handles this for relational filters).

## Clarifications

- **Technical Constraints**: Prisma `where` builder (ADR-015). @grammyjs/menu (ADR-025).
- **Constitution Rules**: Rule LXVIII (List Display). Rule LXIV (Message Update). Rule XIX (Cache) for search state.
- **Integration Points**: Integrates with `database-package` and `ai-core` (semantic search).
- **Edge Cases**: State expires after 30 minutes in Redis. Semantic search uses cosine similarity with HNSW indexing. SQL injection is prevented by Prisma.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST build Prisma `where` conditions directly for relational filters (ADR-015).
- **FR-002**: System MUST use `@grammyjs/menu` for interactive list rendering and navigation (ADR-025).
- **FR-003**: System MUST store search state (page, query, filters) in `cache-manager` (Redis) with a 30-minute TTL.
- **FR-004**: System MUST support `exact` and `semantic` search modes.
- **FR-005**: System MUST provide automatic pagination and result counting for all lists.
- **FR-006**: System MUST support 5+ filter types: `Enum`, `Range`, `DateRange`, `Contains`, `Boolean`.
- **FR-007**: System MUST implement "SearchableList" field for the Input Engine.

### Key Entities

- **SearchState**: currentPage, pageSize, activeFilters, searchQuery, searchMode.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Relational filter processing and DB retrieval must take < 200ms for 100k records.
- **SC-002**: Semantic search results must be returned in < 500ms (including AI embedding step).
- **SC-003**: 100% of search menus must support the "Golden Rule" of editing the existing message.
- **SC-004**: System successfully preserves search state across 100% of valid pagination requests.
