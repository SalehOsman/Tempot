# Notifier Package Research

## Decision 1: Telegram First, Adapter-Ready Core

**Decision:** Implement Telegram delivery first through a structural adapter interface, not through direct bot lifecycle ownership.

**Rationale:** Tempot's current product is a Telegram bot framework. Telegram is the only channel required for this activation, but a notifier package should not make core service code depend on grammY internals or future channel choices.

**Alternatives Rejected:**

- Multi-channel implementation now: rejected as premature and likely to expand scope beyond the current business need.
- Direct `Bot` dependency in `NotifierService`: rejected because apps own bot lifecycle and graceful shutdown.

## Decision 2: Recipient Resolution Through a Port

**Decision:** Role-based and broadcast notification requests use an injected `RecipientResolver`.

**Rationale:** Recipient lookup belongs to user-management or the app composition layer. The notifier package should not import modules or Prisma delegates directly.

**Alternatives Rejected:**

- Query users from notifier directly: rejected because it violates package/module boundaries.
- Pass all recipients manually for broadcast only: rejected because role and broadcast are first-class requirements.

## Decision 3: Queue-backed Delivery with Enqueue-time Rate Offsets

**Decision:** The service enqueues one job per recipient and applies deterministic rate offsets before jobs enter the queue.

**Rationale:** This keeps behavior testable without real Telegram calls and reduces pressure on worker-side throttling. The worker still uses a BullMQ limiter as defense in depth.

**Alternatives Rejected:**

- Single job containing all recipients: rejected because one failed recipient could complicate retry semantics.
- Worker-only limiter: rejected because scheduled bulk jobs could become due at the same moment.

## Decision 4: Events Instead of Direct Remediation

**Decision:** Blocked users and delivery results are published as events. The package does not update user status directly.

**Rationale:** User status belongs to user-management or application composition. Event-driven remediation keeps notifier reusable and compliant with Rule XV.

**Alternatives Rejected:**

- Direct DB mutation from notifier: rejected because it violates repository and package boundaries.
- Swallow blocked-user failures: rejected because operators need remediation signals.

## Decision 5: Audit as an Injected Sink

**Decision:** The processor records attempts through `DeliveryAuditSink`.

**Rationale:** The logger/database packages already own audit storage. A sink keeps notifier independent while still enforcing traceability.

**Alternatives Rejected:**

- Import `AuditLogger` directly: rejected to avoid forcing logger/database dependencies into every notifier consumer.
- Event-only audit: rejected because audit persistence is a separate operational requirement.
