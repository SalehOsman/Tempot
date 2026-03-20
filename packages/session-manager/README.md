# @tempot/session-manager

> Redis + PostgreSQL dual-session strategy. Fast reads from Redis, durable writes to PostgreSQL.

## Purpose

- `SessionManager` — unified interface hiding Redis/PostgreSQL complexity
- `AsyncLocalStorage` context — injects `userId` and `userRole` into every DB call automatically
- Schema versioning — safe session migration on bot updates
- Redis fallback — automatically reads from PostgreSQL when Redis is unavailable
- grammY storage adapter — plugs directly into `bot.use(session(...))`

## Phase

Phase 2 — The Nervous System

## Dependencies

| Package | Purpose |
|---------|---------|
| `ioredis` | Redis client |
| `@tempot/database` | PostgreSQL session persistence |
| `@tempot/event-bus` | Async DB sync after Redis write |
| `@tempot/shared` | cache-manager, AppError |
| `@tempot/logger` | Session operation logging |

## Session Schema

```typescript
interface SessionData {
  userId: number;           // Telegram user ID
  language: string;         // 'ar' | 'en'
  role: UserRole;           // GUEST | USER | ADMIN | SUPER_ADMIN
  status: UserStatus;       // ACTIVE | SUSPENDED | BANNED | PENDING
  activeConversation?: string;
  metadata?: Record<string, unknown>;
  _version: number;         // Schema version for migrations
}
```

## API

```typescript
import { SessionManager, sessionContext } from '@tempot/session-manager';

// grammY integration
bot.use(session({
  initial: () => SessionManager.initial(),
  storage: SessionManager.grammyStorage(),
}));

// In handlers — session via context
bot.command('start', async (ctx) => {
  const session = ctx.session; // typed SessionData
  session.language = 'ar';
  // auto-saved after handler
});

// AsyncLocalStorage — userId available everywhere
const store = sessionContext.getStore();
console.log(store?.userId); // available in repositories, services, etc.
```

## ADRs

- ADR-004 — Redis + PostgreSQL dual session strategy

## Status

⏳ **Not yet implemented** — Phase 2
