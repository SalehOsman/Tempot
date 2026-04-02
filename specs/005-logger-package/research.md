# Research: Logger Package

## Decisions

### 1. Logging Library

- **Decision:** Use Pino as the primary structured logging library.
- **Rationale:** Pino is the fastest Node.js JSON logger, with benchmark performance well under 1ms per log entry (SC-002). It provides native JSON output (FR-001), hierarchical log levels (FR-003), built-in redaction via path-based `redact` option, custom serializers, and a `mixin` function for injecting contextual data. Selected as specified in the Architecture Spec v11.
- **Alternatives considered:** Winston (rejected — slower due to transport-based architecture, heavier dependency tree). Bunyan (rejected — less actively maintained, no built-in redaction). Native `console.*` (rejected — forbidden by constitution Rule XII; no structured output, no redaction, no serialization).

### 2. PII Redaction Strategy

- **Decision:** Dual-layer redaction: (1) Pino's built-in `redact` option for top-level log fields, and (2) a custom `redactRecursive()` function in the error serializer for nested `AppError.details`.
- **Rationale:** Pino's `redact` config handles top-level sensitive fields efficiently using fast-redact internally. However, `AppError.details` can contain arbitrarily nested objects with sensitive data, so a recursive traversal was needed for the serializer path. The sensitive key list is centralized in `SENSITIVE_KEYS` (`logger.config.ts`) and shared by both layers.
- **Alternatives considered:** Pino redact paths with wildcards like `*.password` (rejected — does not cover deeply nested or dynamic structures in error details). Single redaction layer (rejected — Pino redact cannot reach inside custom serializer output; serializer cannot control top-level Pino fields).

### 3. Error Serialization and Rule XXIII

- **Decision:** Custom `appErrorSerializer` that implements Rule XXIII (No Double Logging) via `loggedAt` timestamp check, plus environment-aware stack trace inclusion.
- **Rationale:** Rule XXIII requires that errors are logged exactly once. The serializer checks `err.loggedAt` — if set, it returns a minimal `{ message: 'Already logged', code, __redundant: true }` object. On first serialization, it sets `loggedAt = new Date()` to mark the error as logged. Stack traces are included in non-production environments only, reducing log noise in production while preserving debugging capability in development.
- **Alternatives considered:** Logging deduplication at the caller level (rejected — error-prone, requires discipline from every caller). Separate deduplication middleware (rejected — adds complexity; the serializer is the natural enforcement point since all errors flow through it).

### 4. Session Context Integration

- **Decision:** Use `@tempot/session-manager`'s `sessionContext` (`AsyncLocalStorage`) for automatic user identity injection into both technical logs and audit logs.
- **Rationale:** `AsyncLocalStorage` propagates context through the async call chain without explicit parameter passing. The Pino `mixin` function reads `userId` from the store and injects it into every log entry automatically. The `AuditLogger` reads both `userId` and `userRole` from the store, with explicit entry values taking precedence over session values.
- **Alternatives considered:** Explicit context parameter on every log call (rejected — ergonomic burden, easy to forget). Global user context singleton (rejected — not request-scoped, cannot support concurrent requests).

### 5. Audit Logger Architecture

- **Decision:** `AuditLogger` class with constructor-injected `AuditLogRepository` from `@tempot/database`, returning `AsyncResult<void>` via neverthrow.
- **Rationale:** Follows the Repository Pattern (constitution rule) — no direct Prisma calls in the logger service. Constructor injection enables unit testing with mock repositories. The `AsyncResult<void>` return type adheres to Rule XXI (Result Pattern) — audit logging failures are surfaced as `AppError('logger.audit_log_failed')` rather than thrown exceptions.
- **Alternatives considered:** Direct Prisma client usage (rejected — violates Repository Pattern rule). Fire-and-forget logging without error handling (rejected — violates Rule X, No Silent Failures). Event-based audit logging via Event Bus (considered for future — current implementation uses direct repository calls for simplicity and guaranteed persistence).

### 6. Sensitive Key Configuration

- **Decision:** Centralized `SENSITIVE_KEYS` array in `logger.config.ts` containing: `password`, `token`, `secret`, `apiKey`, `creditCard`.
- **Rationale:** Single source of truth for all redaction operations. Both Pino's `redact` config and the error serializer's `redactRecursive()` reference this same array, ensuring consistency. New sensitive fields can be added in one place.
- **Alternatives considered:** Distributed redaction rules per module (rejected — inconsistent, easy to miss fields). Environment-variable-based configuration (considered for future — current static list covers the known sensitive fields).

## Implementation Divergences from Plan

| Aspect                    | Plan                                    | Actual Code                                                   | Rationale                                                         |
| ------------------------- | --------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------- |
| Error serializer          | Not mentioned as separate file          | `error.serializer.ts` with `redactRecursive`                  | Separation of concerns — serializer logic is non-trivial          |
| Redaction test file       | `tests/unit/redaction.test.ts`          | Tests in `pino-logger.test.ts` and `error.serializer.test.ts` | Redaction tested where it is used — no separate file needed       |
| AuditLogger constructor   | Direct Prisma usage (`prisma.auditLog`) | Repository injection (`AuditLogRepository`)                   | Adheres to Repository Pattern rule                                |
| AuditLogger return type   | Implicit (returns Prisma result)        | `AsyncResult<void>` via neverthrow                            | Adheres to Rule XXI (Result Pattern)                              |
| Logger formatters         | `level` formatter + `isoTime` timestamp | Default Pino formatting (no custom formatters)                | Simpler; default Pino output is sufficient for structured logging |
| Sensitive keys location   | Inline in `pino.logger.ts`              | Centralized in `logger.config.ts`                             | Shared between Pino redact and error serializer                   |
| FR-005 (retention)        | In scope                                | Not implemented in logger package                             | Infrastructure-level concern (log aggregation/rotation)           |
| FR-006 (dashboard viewer) | In scope                                | Not implemented in logger package                             | Responsibility of search-engine package                           |
| SC-004 (critical alerts)  | In scope                                | Not implemented in logger package                             | Responsibility of notifier package                                |

## Key Technical Notes

- **Pino version:** Managed via workspace `package.json`. Pino is a zero-overhead JSON logger — benchmarks show < 0.1ms per log entry for basic operations, well within the SC-002 requirement of < 1ms.
- **neverthrow version:** 8.2.0 (locked per constitution).
- **No `console.*`:** The logger package itself never uses `console.log/error/warn`. All output goes through Pino's structured pipeline.
- **Integration testing:** Uses `@tempot/database/testing` with Testcontainers for real PostgreSQL. Integration tests verify end-to-end persistence of audit log entries including session context merging.
