# @tempot/session-manager

Dual-layer session strategy: fast reads from Redis with async durable writes to PostgreSQL.

## Architecture

```
Request
  │
  ▼
SessionProvider
  ├─ [1] Redis (cache-manager)  ← primary read/write, 24h sliding TTL
  │        │ on miss or failure
  ├─ [2] PostgreSQL (repository) ← persistent fallback
  │
  └─ BullMQ worker ← async Redis→Postgres sync via event bus
```

- **AsyncLocalStorage** propagates `userId`/`userRole` through the call stack without threading it manually.
- **Schema versioning** via `migrateSession()` handles breaking session shape changes across deploys.

## Key Features

- Sliding 24h TTL — each `getSession` call resets the Redis expiration
- Optimistic concurrency control (OCC) — `version` field incremented on every save
- Rule XXXII degradation alert — Redis failures trigger a SUPER_ADMIN logger alert before falling back
- Composite session key — `session:{userId}:{chatId}` allows per-chat session isolation

## Session Key Strategy

Sessions are keyed by `userId + chatId` composite. This means a single Telegram user can hold independent sessions across different chats (groups, private, channels).

## Usage

```typescript
import { SessionProvider, sessionContext } from '@tempot/session-manager';

// Construct with dependencies
const provider = new SessionProvider(
  cache,      // { get, set, del } — Result-returning cache adapter
  eventBus,   // { publish } — Result-returning event bus
  repository, // SessionRepository instance
  logger,     // optional — { error: (data: object) => void }
);

// Read a session (Redis first, Postgres fallback)
const result = await provider.getSession(userId, chatId);
if (result.isOk()) {
  const session = result.value; // typed Session
}

// Write a session (increments version, syncs async to Postgres)
await provider.saveSession({ ...session, language: 'ar' });

// Delete a session from both layers
await provider.deleteSession(userId, chatId);

// Propagate context through the call stack
sessionContext.run({ userId, userRole: session.role }, () => {
  // userId available anywhere via sessionContext.getStore()
});
```

## Degradation Behavior (Rule XXXII)

When Redis is unavailable, `SessionProvider` automatically falls back to the PostgreSQL repository. A `SYSTEM_DEGRADATION` event is logged via `logger.error` with `target: 'SUPER_ADMIN'` so operators are alerted. The system continues functioning — no request is dropped.

## Schema Versioning

`migrateSession(session)` compares `session.schemaVersion` against `CURRENT_SCHEMA_VERSION`. If the versions differ, it applies incremental migrations (v1→v2 etc.). Unknown future versions return an `AppError`. Add new migration steps inside `src/migrator.ts` as the schema evolves.

- `schemaVersion` — tracks breaking changes to the session shape (incremented manually on schema changes)
- `version` — tracks write conflicts for OCC (incremented automatically on every `saveSession`)

## Running Tests

```bash
pnpm --filter @tempot/session-manager test
```

Requires Docker for Testcontainers (PostgreSQL + Redis).
