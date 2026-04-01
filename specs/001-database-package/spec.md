# Feature Specification: Database Package

**Feature Branch**: `001-database-package`  
**Created**: 2026-03-19  
**Status**: Complete  
**Input**: User description: "Establish the foundational database package using Prisma and Drizzle (pgvector) as per Tempot v11 Blueprint."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Core Data Persistence (Priority: P1)

As a developer, I want to define and persist relational data using Prisma so that the application has a reliable source of truth.

**Why this priority**: Foundational for almost every other feature in the framework.

**Independent Test**: Verified by running Prisma migrations on a test PostgreSQL instance and performing CRUD operations on a sample entity via the `BaseRepository`.

**Acceptance Scenarios**:

1. **Given** a new Prisma schema definition, **When** I run the migration command, **Then** the PostgreSQL database is updated correctly with appropriate types and constraints.
2. **Given** a defined repository inheriting from `BaseRepository`, **When** I create a record, **Then** it is persisted correctly with all `BaseEntity` audit fields (`id`, `createdAt`, `createdBy`) automatically populated.

---

### User Story 2 - Soft Delete & Global Filtering (Priority: P1)

As a system administrator, I want records to be "soft deleted" by default so that accidental deletions can be recovered and data integrity is maintained.

**Why this priority**: Required by the Project Constitution (Rule XXVII) to ensure enterprise-grade safety.

**Independent Test**: Create a record, call the delete method, and verify it still exists in the database with `isDeleted: true` but does not appear in standard `findMany` queries.

**Acceptance Scenarios**:

1. **Given** an existing database record, **When** I call the `delete` method on its repository, **Then** the record is not removed from the table but `isDeleted` is set to `true`, and `deletedAt`/`deletedBy` are populated.
2. **Given** a soft-deleted record, **When** I perform a standard Prisma query, **Then** the record is automatically filtered out unless explicitly requested.

---

### User Story 3 - Vector Search via Drizzle (Priority: P2)

As an AI-driven bot, I want to store and search vector embeddings using pgvector so that I can provide relevant semantic search results to users.

**Why this priority**: Essential for the "Smart Bot" core capability and AI integration (ADR-017).

**Independent Test**: Storing a 768-dimension vector (Gemini default, configurable via `VECTOR_DIMENSIONS` env var) and performing a cosine similarity search via Drizzle ORM.

**Acceptance Scenarios**:

1. **Given** an embedding vector from the AI core, **When** I save it via Drizzle, **Then** it is stored in the pgvector column with full type safety.
2. **Given** a search query vector, **When** I perform a similarity search, **Then** the system returns the most relevant records ordered by cosine distance in < 100ms for datasets up to 100K vectors.

---

## Edge Cases

- **Concurrent Updates**: How does the `updatedBy` field handle high-concurrency updates to the same record? (Answer: AsyncLocalStorage must be strictly managed).
- **Migration Conflicts**: What happens when two modules have conflicting table names? (Answer: Enforce `{module-name}_{table}` naming convention via validator).
- **Large Vector Search**: Performance degradation when searching millions of vectors (Answer: HNSW Indexing is mandatory for large datasets).

## Clarifications

- **Technical Constraints**: Prisma 7+ for relational data, Drizzle for pgvector (ADR-017). PostgreSQL + pgvector is the mandatory stack.
- **Constitution Rules**: Rule XXVII (Soft Delete) must be implemented via Prisma Client extensions (not middleware) to ensure it's applied globally. ADR-030 (Code Limits) applies to all repository and migration files.
- **Integration Points**: Provides `BaseRepository` for all other packages and modules. Integrates with `logger-package` for Audit Logs (Section 10.2).
- **Edge Cases**: High-concurrency updates to `updatedBy` must be handled via `AsyncLocalStorage`. Schema conflicts between modules are prevented by the `{module-name}_{table}` naming convention. HNSW indexing is mandatory for vector datasets > 100k records.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST use Prisma 7+ as the primary ORM for all relational and structural data.
- **FR-002**: System MUST use Drizzle ORM for pgvector operations to provide native vector type safety (ADR-017).
- **FR-003**: System MUST implement a `BaseRepository` that abstracts Prisma/Drizzle complexity from the modules.
- **FR-004**: System MUST automatically populate `BaseEntity` audit fields using `AsyncLocalStorage` to capture user context without manual injection.
- **FR-005**: System MUST enforce soft delete globally via Prisma Client extensions (not middleware).
- **FR-006**: System MUST support independent Prisma schemas and migrations per module located in `/modules/{module}/database/`.
- **FR-007**: System MUST provide a `TransactionManager` that supports atomic operations across multiple repositories.

### Key Entities

- **BaseEntity**: Abstract fields including `id` (UUID/CUID), `createdAt`, `updatedAt`, `createdBy`, `updatedBy`, `isDeleted`, `deletedAt`, `deletedBy`.
- **AuditLog**: Stores JSON diffs of changes (before/after) for critical entities (linked to Section 10.2).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of standard CRUD operations must be type-safe at compile time.
- **SC-002**: Soft delete logic must have zero (0ms) overhead on developer productivity (automatic).
- **SC-003**: Vector similarity search must return results in < 150ms for a dataset of 100,000 vectors (evaluated on production-equivalent CI runners).
- **SC-004**: System must successfully pass 100% of integration tests using Testcontainers (PostgreSQL).
