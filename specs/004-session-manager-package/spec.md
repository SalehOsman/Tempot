# Feature Specification: Session Manager (Dual-layer)

**Feature Branch**: `004-session-manager-package`  
**Created**: 2026-03-19  
**Status**: Draft  
**Input**: User description: "Establish the foundational session-manager package using a dual-layer strategy (Redis + Postgres) as per Tempot v11 Blueprint."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Fast & Persistent Sessions (Priority: P1)

As a user, I want my session to be fast and persistent so that my conversation flow is never lost even if the server restarts.

**Why this priority**: Core UX and data integrity requirement for a professional bot experience.

**Independent Test**: Verified by checking session data in Redis for fast access and Postgres for long-term persistence within an integration test.

**Acceptance Scenarios**:

1. **Given** an active session, **When** I send a message, **Then** the system retrieves the session from Redis in < 2ms to process the request quickly.
2. **Given** a Redis failure, **When** the user sends a message, **Then** the system falls back to PostgreSQL to retrieve the session without interrupting the user experience (Rule XXXII).

---

### User Story 2 - Conversation State Management (Priority: P1)

As a developer, I want to store the state of the current conversation (e.g., active step, collected data) so that I can handle complex multi-step forms easily without manual session management.

**Why this priority**: Required for the Dynamic Input Engine and overall framework flexibility.

**Independent Test**: Storing complex conversation state and retrieving it in the next update within a grammY `Conversation`.

**Acceptance Scenarios**:

1. **Given** a multi-step form, **When** the user is on step 2, **Then** the `activeConversation` and `metadata` are correctly stored in the session object.
2. **Given** a session with metadata, **When** I access the session via the context, **Then** the metadata is fully type-safe and consistent.

---

## Edge Cases

- **Redis Sync Failure**: What happens if Redis fails to sync to Postgres? (Answer: Use a reliable event-driven mechanism or background worker with retries).
- **Session Versioning**: Handling breaking changes to the session structure (Answer: Implement `Session Schema Versioning` with a migration handler as per Section 15.6).
- **Concurrency**: Multiple updates to the same session from different requests (Answer: Redis atomic updates or simple last-write-wins with version checking).

## Clarifications

- **Technical Constraints**: Dual-layer (Redis + Postgres). Uses `AsyncLocalStorage` for global access.
- **Constitution Rules**: Rule XXXII (Redis Degradation) applies here for session retrieval. ADR-011 (Cache) usage for fast access.
- **Integration Points**: Heart of the `bot-server`. Used by `input-engine` for multi-step form state.
- **Edge Cases**: Redis to Postgres sync failure must be handled via background retries. Session Schema Versioning (Section 15.6) handles breaking changes to session metadata. Last-write-wins with version checking handles concurrency.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST implement a dual-layer session strategy: Redis (Primary Fast Read) + PostgreSQL (Secondary Persistent Storage).
- **FR-002**: System MUST use `AsyncLocalStorage` to make the current session globally accessible within a request context.
- **FR-003**: System MUST automatically sync session changes from Redis to Postgres asynchronously via the `event-bus`.
- **FR-004**: System MUST support hierarchical session metadata stored as a JSON object.
- **FR-005**: System MUST implement `Session Schema Versioning` for handling breaking changes to session data.
- **FR-006**: System MUST provide a `SessionProvider` that hides Redis/Postgres complexity from the `bot-server`.
- **FR-007**: System MUST support automatic session expiration (TTL) in Redis (e.g., 24 hours).

### Key Entities

- **Session**: A unified object containing `userId`, `role`, `status`, `language`, `activeConversation`, `metadata`, and `version`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Session retrieval from Redis must take < 2ms on average.
- **SC-002**: 100% of session changes must be persisted to Postgres eventually with no data loss.
- **SC-003**: System successfully handles Redis failure by falling back to Postgres without crashing or losing user context.
- **SC-004**: Session structure migrations are handled without interrupting active conversations for users.
