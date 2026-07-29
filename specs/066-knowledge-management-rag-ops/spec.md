# Feature Specification: Knowledge Management RAG Operations

**Feature Branch**: `codex/knowledge-management-rag-ops`  
**Created**: 2026-07-28  
**Status**: Draft  
**Input**: Product Manager approval to create a professional Telegram-operated
RAG Operations Console for documentation indexing, source selection, AI/RAG
readiness checks, ingestion history, and test queries.

## Existing Source Requirements

This feature activates an operational surface for requirements already present
in the project AI/RAG roadmap and architecture.

| Source | Existing Requirement | Spec Impact |
| --- | --- | --- |
| `.specify/memory/constitution.md` Rule XXXIII | Modules with AI must define degradation mode. | The module must declare `hasAI: true` and graceful degradation. |
| `.specify/memory/constitution.md` Rule XXV | Requests pass through security, authorization, validation, and audit. | All ingestion and destructive indexing actions require RBAC, validation, and audit. |
| `.specify/memory/constitution.md` Rule LVII | State-changing operational actions are audited. | Dry-run, write, full reindex, and source changes must create audit-safe records. |
| `docs/architecture/ai-rag-runtime-activation-plan.md` | AI/RAG activation requires ingestion write smoke and retrieval smoke evidence. | The module must expose operator evidence for ingestion and test query readiness. |
| `packages/ai-core` | Content ingestion, embeddings, and RAG retrieval already exist. | The module must reuse `@tempot/ai-core` through bot-server composition, not rebuild ingestion logic. |
| `apps/docs` ingestion runtime | Dry-run and write ingestion commands already exist. | The module should reuse the same source discovery and ingestion concepts through a runtime provider. |
| `docs/developer/module-capability-reuse-standard.md` | Modules must reuse existing packages instead of rebuilding capabilities. | Knowledge operations must compose existing packages and only own operator UX. |

## Scope Boundary

The feature has two deliverables:

1. `modules/knowledge-management`: Telegram super-admin operations console for
   source profiles, dry-run preview, write ingestion, full reindex, status,
   history, and RAG test queries.
2. `apps/bot-server` runtime provider: safe composition boundary that gives the
   module controlled access to existing `@tempot/ai-core` ingestion and retrieval
   services.

The module must not import `@tempot/ai-core`, `pg`, Drizzle, filesystem readers,
or provider SDKs directly. It receives an injected operations provider from
`bot-server`.

The first release is local/staging operations focused. Production use remains
blocked until deployment-specific source mounts, provider credentials, and
staging evidence are documented and approved.

## User Scenarios & Testing

### User Story 1 - Check RAG Readiness (Priority: P1)

A super admin can open Knowledge Management and immediately see whether AI/RAG
is ready: AI enabled, provider configured, database reachable, pgvector present,
and embeddings available.

**Independent Test**: With mocked provider health results, opening the module
renders healthy, degraded, and unconfigured states with localized messages.

**Acceptance Scenarios**:

1. **Given** RAG dependencies are configured, **When** the super admin opens
   status, **Then** the bot shows AI status, vector schema status, embeddings
   count, last ingestion run, and next recommended action.
2. **Given** embeddings count is zero, **When** status is shown, **Then** the
   bot recommends dry-run before write ingestion.
3. **Given** AI credentials are missing, **When** status is shown, **Then** the
   bot shows a safe configuration hint without exposing secrets.

### User Story 2 - Select Approved Knowledge Sources (Priority: P1)

A super admin can select from approved source profiles without entering arbitrary
filesystem paths.

**Independent Test**: The source selection surface lists only allowlisted
profiles and rejects unregistered profile callbacks.

**Acceptance Scenarios**:

1. **Given** source profiles are configured, **When** the operator opens sources,
   **Then** the bot shows profile name, scope, content type, language coverage,
   and whether the profile is currently enabled.
2. **Given** a callback references an unknown profile, **When** it is processed,
   **Then** the module rejects it and records a safe warning.
3. **Given** the operator needs project-wide indexing, **When** they select the
   full-project profile, **Then** the bot explains cost and runtime impact before
   any write operation is allowed.

### User Story 3 - Run Dry-Run Preview (Priority: P1)

A super admin can run a dry-run preview that discovers files, computes chunks,
and reports expected indexing volume without writing embeddings.

**Independent Test**: A dry-run request returns discovered files, chunk count,
skipped files, failed files, and `hashesWritten: false`.

**Acceptance Scenarios**:

1. **Given** at least one source profile is selected, **When** dry-run starts,
   **Then** the module creates an operational job and shows a processing state.
2. **Given** dry-run completes, **When** the result is displayed, **Then** the bot
   shows files processed, chunks, skipped files, failures, and write eligibility.
3. **Given** dry-run has failures, **When** the result is displayed, **Then** the
   bot lists only safe file references and failure categories.

### User Story 4 - Write Embeddings With Confirmation (Priority: P1)

A super admin can run write ingestion only after a successful dry-run and an
explicit confirmation.

**Independent Test**: Write ingestion is blocked until a recent dry-run exists
for the same source profile and confirmation token.

**Acceptance Scenarios**:

1. **Given** no recent dry-run exists, **When** write ingestion is requested,
   **Then** the module refuses the request and prompts for dry-run.
2. **Given** dry-run succeeded, **When** write ingestion is requested, **Then**
   the bot requires explicit confirmation showing profile, file count, chunk
   count, and expected impact.
3. **Given** write ingestion completes, **When** the result is displayed, **Then**
   the bot shows saved chunks, failed files, hash update status, duration, and
   next test-query action.

### User Story 5 - Run Full Reindex Safely (Priority: P2)

A super admin can force full reindex for selected profiles after clear warnings
and two confirmations.

**Independent Test**: Full reindex requires two confirmation steps and rejects
expired confirmation callbacks.

**Acceptance Scenarios**:

1. **Given** full reindex is selected, **When** the first confirmation appears,
   **Then** the bot explains that existing hashes or embeddings may be replaced.
2. **Given** the second confirmation expires, **When** the callback is pressed,
   **Then** the operation is not executed.
3. **Given** full reindex succeeds, **When** the result is shown, **Then** the bot
   records safe evidence and recommends a test query.

### User Story 6 - Test RAG Query Before User Use (Priority: P2)

A super admin can submit a test question from the operations console and verify
retrieval result count, citations, and no-context behavior before relying on
`/ask`.

**Independent Test**: A test query calls the injected provider and renders
answered, no-context, and degraded states without exposing raw provider errors.

## Edge Cases

- No source profile is configured.
- The configured source root is not mounted in the running container.
- A selected profile points outside the allowlisted project root.
- Dry-run succeeds but write mode fails because AI credentials are unavailable.
- AI provider times out mid-ingestion.
- The vector schema exists but the embeddings table is empty.
- The selected content type is not accessible to the requesting test-query role.
- A write request is submitted while another ingestion job is active.
- Confirmation expires before write or full reindex.
- Operator tries to enter or trigger an arbitrary filesystem path.
- Hash storage update fails after embeddings were written.
- Some files fail while others succeed.
- Telegram callback is stale after a bot restart.
- Non-super-admin opens the module or presses an operation callback.

## Requirements

### Functional Requirements

- **FR-001**: The system MUST provide a dedicated Knowledge Management module
  for AI/RAG operational indexing and readiness.
- **FR-002**: The module MUST be available to `SUPER_ADMIN` only by default.
- **FR-003**: The module MUST declare `hasAI: true` and `aiDegradationMode:
  graceful`.
- **FR-004**: The module MUST use an injected operations provider from
  `bot-server` and MUST NOT instantiate AI, database, or filesystem services
  directly.
- **FR-005**: The module MUST expose RAG readiness status covering AI enabled,
  provider readiness, database reachability, pgvector readiness, embeddings
  count, and last ingestion summary.
- **FR-006**: The module MUST expose source profiles from an allowlist and MUST
  NOT accept arbitrary paths from Telegram messages or callbacks.
- **FR-007**: Each source profile MUST define id, display key, source roots,
  content type, language policy, source priority, and source-of-truth flag.
- **FR-008**: Dry-run ingestion MUST discover files and chunks without writing
  embeddings or hashes.
- **FR-009**: Write ingestion MUST be blocked until a recent successful dry-run
  exists for the same selected source profile.
- **FR-010**: Write ingestion MUST require explicit confirmation before any
  provider call that writes embeddings.
- **FR-011**: Full reindex MUST require two confirmations and clear warning text.
- **FR-012**: The module MUST reject expired or stale confirmation callbacks.
- **FR-013**: Ingestion operations MUST run as jobs or provider-managed
  asynchronous operations so Telegram handlers remain responsive.
- **FR-014**: The module MUST show bounded history for recent ingestion jobs.
- **FR-015**: The module MUST show safe job detail including profile, mode,
  status, processed files, chunks, failed files, duration, and remediation hint.
- **FR-016**: The module MUST publish lifecycle events for dry-run, write,
  reindex, failure, and completion states.
- **FR-017**: The module MUST record safe audit metadata for every state-changing
  operation.
- **FR-018**: The module MUST provide a RAG test query action for super admins.
- **FR-019**: The test query MUST show citations when context is returned and a
  localized no-context message otherwise.
- **FR-020**: The module MUST not expose provider credentials, database URLs,
  raw API errors, or sensitive file contents in bot messages.
- **FR-021**: Operator-facing text MUST come from Arabic and English locale
  files.
- **FR-022**: Telegram buttons MUST follow existing UX rules for icon usage,
  row width, and confirmation layout.
- **FR-023**: Docker/local operation MUST document required read-only source
  mounts or approved execution mode before write ingestion is considered ready.
- **FR-024**: The feature MUST update AI/RAG activation documentation and roadmap
  status after implementation.
- **FR-025**: The feature MUST support local Ollama embeddings for knowledge
  indexing through `AI_EMBEDDING_PROVIDER=ollama` without requiring external
  provider quota.

### Key Entities

- **Knowledge Source Profile**: Approved source configuration that maps safe
  source roots to content type, language policy, priority, and operator label.
- **Ingestion Job**: Dry-run, write, or full-reindex operation with actor,
  profile, mode, status, timing, progress, and failure category.
- **Ingestion Summary**: Safe result summary containing processed files, chunks,
  skipped files, failed files, hashes-written state, and duration.
- **Ingestion Confirmation**: Expiring approval token for write or full-reindex
  operations.
- **RAG Readiness Snapshot**: Current dependency and data availability state for
  AI/RAG operations.
- **RAG Test Query Result**: Safe retrieval test result with answer state,
  result count, citations, confidence, and remediation hint.

## Success Criteria

- **SC-001**: A super admin can reach Knowledge Management from the main menu
  and view RAG readiness in no more than two interactions.
- **SC-002**: A dry-run can complete without writing embeddings or hashes.
- **SC-003**: Write ingestion is impossible without a recent matching dry-run
  and confirmation.
- **SC-004**: Arbitrary filesystem paths are rejected by design and by tests.
- **SC-005**: The status screen reports `embeddings_count = 0` as an actionable
  no-knowledge state, not as a system failure.
- **SC-006**: A successful write ingestion increases the embeddings count for
  the selected profiles in acceptance testing.
- **SC-007**: The `/ask` assistant can retrieve indexed documentation after
  write ingestion succeeds.
- **SC-008**: All RAG operations create safe audit or lifecycle evidence without
  exposing secrets.

## Assumptions

- `@tempot/ai-core` remains the source of ingestion, embedding, and retrieval
  logic.
- The bot runtime must receive source files through approved read-only mounts or
  a separate approved ingestion worker because the production image intentionally
  does not contain the full repository source tree.
- The first implementation targets Telegram super-admin operations; dashboard
  support is future work.
- Cost estimation is initially approximate and based on files and chunk counts,
  not provider billing APIs.
