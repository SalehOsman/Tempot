# Design Spec — @tempot/logger (Pino + Audit Logger)

## 1. Overview
The `@tempot/logger` package provides a dual-purpose logging system:
1.  **Technical Logger:** A high-performance JSON logger (Pino) for system events and debugging.
2.  **Audit Logger:** A database-backed service for tracking critical state changes (Rule LVII).

## 2. Architecture
- **Layer:** Services (`packages/`)
- **Dependencies:** 
  - `@tempot/shared` (for `AppError`, `Result`)
  - `@tempot/session-manager` (for `AsyncLocalStorage`)
  - `@tempot/database` (for `AuditLogger` persistence)
  - `pino` (core engine)

## 3. Core Components

### 3.1 Technical Logger (Pino)
- **Automatic Context:** Uses `mixin()` to inject `userId` from `sessionContext` (ALS) into every log entry.
- **Centralized Redaction:** A `SENSITIVE_KEYS` list (password, token, apiKey, secret) used by Pino's `redact` option.
- **Custom AppError Serializer:**
  - Detects `AppError` instances.
  - Formats `code` and `i18nKey`.
  - Recursively obfuscates `details` using `SENSITIVE_KEYS`.
  - Conditional Stack Traces: Included if `process.env.NODE_ENV !== 'production'`.
  - **Rule XXIII:** Respects the `loggedAt` flag to prevent duplicate logging.

### 3.2 Audit Logger
- **Interface:** `AuditLogger.log(entry: AuditLogEntry): AsyncResult<void>`
- **Persistence:** Uses Prisma to write to the `AuditLog` table.
- **Automatic Identity:** Merges the current session's `userId` and `userRole` into the entry.
- **AuditLogEntry Fields (Rule LVII):**
  - `userId` (string, optional)
  - `userRole` (string, optional)
  - `action` (string) - e.g., `user.create`
  - `module` (string)
  - `targetId` (string, optional)
  - `before` (Json, optional)
  - `after` (Json, optional)
  - `status` (string) - default: `SUCCESS`
  - `timestamp` (Date) - default: `now`

## 4. Testing Strategy (Strict TDD)
- **Unit Tests:**
  - Verify PII redaction in both standard logs and error details.
  - Verify automatic `userId` injection via mocked `sessionContext`.
  - Verify `AppError` serialization formatting.
- **Integration Tests:**
  - Verify `AuditLogger` database persistence using Testcontainers.

## 5. Security & Performance
- **Rule XXV Compliance:** Automatic PII stripping in error details.
- **High Throughput:** Pino ensures minimal overhead for system-level logging.
