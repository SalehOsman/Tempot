# Feature Specification: Event Bus (Local & Redis)

**Feature Branch**: `006-event-bus-package`  
**Created**: 2026-03-19  
**Status**: Complete  
**Input**: User description: "Establish the foundational event-bus package providing three levels of event-driven communication (Local, Internal, External) as per Architecture Spec v11 Blueprint."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Decoupled Module Communication (Priority: P1)

As a developer, I want to communicate between modules via events so that my modules are decoupled and I can easily add new features without modifying existing code.

**Why this priority**: Core architectural requirement (Rule XV) to maintain modularity and prevent tangled dependencies.

**Independent Test**: Verified by emitting an event in one module and confirming that a listener in a different module receives and processes it correctly.

**Acceptance Scenarios**:

1. **Given** a module-specific event (e.g., `invoices.payment.completed`), **When** it is emitted, **Then** all registered listeners across all modules receive the event and payload.
2. **Given** a listener that fails, **When** an event occurs, **Then** the failure is caught, isolated (does not block other listeners), and logged as an error. **[DEFERRED: automatic retries depend on FR-005 / BullMQ integration]**

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

- **Event Ordering**: Ensuring events are processed in the order they were emitted (Answer: Redis Pub/Sub delivers messages in publish order per channel; local events are dispatched synchronously via EventEmitter).
- **Large Payloads**: Handling events with large data payloads (Answer: Event payloads should be kept small; store large data in DB and pass the ID in the payload).
- **Listener Failure**: Preventing a single failing listener from blocking the entire event bus (Answer: Each listener should run in its own try/catch or isolated process).

## Clarifications

- **Technical Constraints**: Two operational levels: Local (EventEmitter, handles both in-process and module-to-module events) and External (Redis Pub/Sub, handles cross-instance events). The spec originally described three levels (Local, Internal, External) but Internal was collapsed into Local during implementation since both use in-process EventEmitter dispatch.
- **Constitution Rules**: Rule XV (Event-Driven Communication) is mandatory for inter-module calls. Naming convention `{module}.{entity}.{action}` is strictly enforced.
- **Integration Points**: Used by `session-manager` (sync), `cms-engine` (invalidation), and `notifier`.
- **Edge Cases**: Event ordering is maintained by Redis Pub/Sub per-channel ordering and synchronous local dispatch. Large payloads are replaced by IDs with DB lookups. Listener failures are caught and logged; automatic retries are deferred (see FR-005).
- **Typed Publish Contracts**: All `publish()` methods use conditional generics from a centralized `TempotEvents` type registry (ADR-035). Consumer packages define structurally-compatible typed adapters with method overloads — see data-model.md for the adapter table.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST support three distinct event levels: `Local` (EventEmitter), `Internal` (Module-to-Module), `External` (Redis Pub/Sub).
  > **Implementation Note**: `Internal` was collapsed into `Local` during implementation — both use in-process EventEmitter dispatch. The `EventLevel` type retains all three values for forward compatibility, but `Local` and `Internal` behave identically at runtime.
- **FR-002**: System MUST enforce the naming convention: `{module}.{entity}.{action}` (e.g., `users.user.role_changed`).
- **FR-003**: System MUST provide a unified `EventBus` service accessible to all packages and modules.
- **FR-004**: System SHOULD minimize event loss for External events. Redis Pub/Sub provides at-most-once delivery; guaranteed delivery requires BullMQ queue integration (deferred).
  > **Implementation Note**: Current implementation uses Redis Pub/Sub which is fire-and-forget. Events published when no subscriber is connected are lost. For guaranteed delivery, a future BullMQ-based transport is planned.
- **FR-005**: System SHOULD implement automatic retries (up to 3 times) for failed event processing tasks.
  > **[DEFERRED]**: Retry logic with BullMQ workers is not implemented in the initial release. Events that fail are logged but not retried.
- **FR-006**: System SHOULD automatically log event history and failures to the Audit Log (Section 10.2).
  > **[DEFERRED]**: Audit logging integration depends on the logger package's AuditLogger. Not implemented in the initial release.
- **FR-007**: System SHOULD support wildcards in event listeners (e.g., `invoices.*.completed`).
  > **[DEFERRED]**: Wildcard pattern matching for event subscriptions is not implemented. All subscriptions use exact string matching.
- **FR-008**: System MUST support `TEMPOT_EVENT_BUS=true/false` environment variable (default: `true`) per Rule XVI. When disabled, EventBusOrchestrator silently drops all publish() calls (returns ok()) and subscribe() registers handlers that are never triggered.
  > **[DEFERRED]**: The pluggable toggle is not implemented in the initial release. The event bus has graceful degradation via ConnectionWatcher (falls back to local when Redis is unavailable), but the full disable toggle requires dedicated implementation — see Task 8 in tasks.md.

### Key Entities

- **Event**: A unified object containing `eventId`, `eventName`, `module`, `userId`, `payload` (JSON), `timestamp`, and `level`.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Local event delivery overhead must be < 1ms to ensure high performance.
- **SC-002**: 100% of inter-module communication must use the Event Bus as per Rule XV.
- **SC-003**: External events must be successfully delivered across multiple server instances with 100% reliability. **[DEFERRED: depends on BullMQ transport for guaranteed delivery; Redis Pub/Sub provides at-most-once]**
- **SC-004**: System correctly handles and retries 100% of temporary listener failures. **[DEFERRED: retry logic depends on FR-005 BullMQ integration]**
