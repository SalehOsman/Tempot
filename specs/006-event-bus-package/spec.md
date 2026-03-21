# Feature Specification: Event Bus (Local & Redis)

**Feature Branch**: `006-event-bus-package`  
**Created**: 2026-03-19  
**Status**: Draft  
**Input**: User description: "Establish the foundational event-bus package providing three levels of event-driven communication (Local, Internal, External) as per Tempot v11 Blueprint."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Decoupled Module Communication (Priority: P1)

As a developer, I want to communicate between modules via events so that my modules are decoupled and I can easily add new features without modifying existing code.

**Why this priority**: Core architectural requirement (Rule XV) to maintain modularity and prevent tangled dependencies.

**Independent Test**: Verified by emitting an event in one module and confirming that a listener in a different module receives and processes it correctly.

**Acceptance Scenarios**:

1. **Given** a module-specific event (e.g., `invoices.payment.completed`), **When** it is emitted, **Then** all registered listeners across all modules receive the event and payload.
2. **Given** a listener that fails, **When** an event occurs, **Then** the event is retried according to the system policy (up to 3 times) before being logged as an error.

---

### User Story 2 - Cross-service Scalability (Priority: P1)

As a system administrator, I want to distribute events across multiple server instances via Redis so that the system can scale horizontally to handle higher traffic.

**Why this priority**: Essential for production-ready scalability and reliability (Section 14.1).

**Independent Test**: Verified by emitting an `EXTERNAL` level event and confirming it is received by a listener running in a separate process or server instance.

**Acceptance Scenarios**:

1. **Given** an `EXTERNAL` level event, **When** it is emitted, **Then** it is published to Redis Pub/Sub for cross-instance delivery.
2. **Given** a Redis-based listener on a different server instance, **When** the event is published, **Then** it is processed exactly like a local event with all metadata preserved.

---

## Edge Cases

- **Event Ordering**: Ensuring events are processed in the order they were emitted (Answer: Redis-backed events are processed sequentially within a queue).
- **Large Payloads**: Handling events with large data payloads (Answer: Event payloads should be kept small; store large data in DB and pass the ID in the payload).
- **Listener Failure**: Preventing a single failing listener from blocking the entire event bus (Answer: Each listener should run in its own try/catch or isolated process).

## Clarifications

- **Technical Constraints**: Three levels: Local (EventEmitter), Internal (Module-to-Module), External (Redis Pub/Sub).
- **Constitution Rules**: Rule XV (Event-Driven Communication) is mandatory for inter-module calls. Naming convention `{module}.{entity}.{action}` is strictly enforced.
- **Integration Points**: Used by `session-manager` (sync), `cms-engine` (invalidation), and `notifier`.
- **Edge Cases**: Event ordering is guaranteed by sequential processing in Redis queues. Large payloads are replaced by IDs with DB lookups. Listener failures are retried 3 times before error logging.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support three distinct event levels: `Local` (EventEmitter), `Internal` (Module-to-Module), `External` (Redis Pub/Sub).
- **FR-002**: System MUST enforce the naming convention: `{module}.{entity}.{action}` (e.g., `users.user.role_changed`).
- **FR-003**: System MUST provide a unified `EventBus` service accessible to all packages and modules.
- **FR-004**: System MUST guarantee no event loss for `External` events via Redis persistence.
- **FR-005**: System MUST implement automatic retries (up to 3 times) for failed event processing tasks.
- **FR-006**: System MUST automatically log event history and failures to the Audit Log (Section 10.2).
- **FR-007**: System MUST support wildcards in event listeners (e.g., `invoices.*.completed`).

### Key Entities

- **Event**: A unified object containing `eventId`, `eventName`, `module`, `userId`, `payload` (JSON), `timestamp`, and `level`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Local event delivery overhead must be < 1ms to ensure high performance.
- **SC-002**: 100% of inter-module communication must use the Event Bus as per Rule XV.
- **SC-003**: External events must be successfully delivered across multiple server instances with 100% reliability.
- **SC-004**: System correctly handles and retries 100% of temporary listener failures.
