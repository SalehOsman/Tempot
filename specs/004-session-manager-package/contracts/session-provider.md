# Contract: Session Provider

The `SessionProvider` is the primary interface exposed by the `session-manager` package. It abstracts away the dual-layer complexity (Redis + Postgres) and provides a unified interface for the rest of the application (e.g., bot server, input engine).

## Interface Definition

```typescript
import { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';

export interface ISessionProvider {
  /**
   * Retrieves a session by the composite key (userId + chatId).
   * 1. Attempts to fetch from Redis.
   * 2. If missing or Redis fails, falls back to Postgres.
   * 3. Extends the sliding TTL in Redis if retrieved successfully.
   */
  getSession(userId: string, chatId: string): Promise<Result<Session, AppError>>;

  /**
   * Saves or updates a session.
   * 1. Applies Optimistic Concurrency Control using the version field.
   * 2. Saves to Redis.
   * 3. Dispatches an event via the Event Bus to sync to Postgres asynchronously.
   */
  saveSession(session: Session): Promise<Result<void, AppError>>;

  /**
   * Deletes a session from both Redis and Postgres.
   */
  deleteSession(userId: string, chatId: string): Promise<Result<void, AppError>>;

  /**
   * Optional helper to migrate session metadata if the schema has changed.
   * Uses the internal schema versioning mechanism.
   */
  migrateSession?(session: Session): Result<Session, AppError>;
}
```

## Global Access

A global access mechanism using `AsyncLocalStorage` must also be provided, exposing the *current* request's session without passing it explicitly through every function signature.

```typescript
export const sessionContext: AsyncLocalStorage<Session>;
```
