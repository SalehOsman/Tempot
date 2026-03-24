# Quickstart: Session Manager

This package provides a dual-layer (Redis + Postgres) session management strategy for the Tempot bot framework.

## Usage Example

```typescript
import { SessionProvider, sessionContext } from '@tempot/session-manager';
import { Result } from 'neverthrow';

// 1. Initialize the Provider
const provider = new SessionProvider();

// 2. Fetch a Session
const sessionResult = await provider.getSession('user-123', 'chat-456');

if (sessionResult.isErr()) {
  console.error("Failed to load session:", sessionResult.error);
  return;
}

const session = sessionResult.value;

// 3. Make Session globally available for the current request
sessionContext.run(session, async () => {
  // Inside this block, any service can access the current session
  const currentSession = sessionContext.getStore();
  
  // 4. Update the session
  currentSession.language = 'en-US';
  
  // 5. Save the session
  // This updates Redis (fast read) and triggers an event to sync to Postgres (persistent)
  await provider.saveSession(currentSession);
});
```

## Setup & Dependencies

Make sure your `.env` contains the required connections:
- `REDIS_URL`
- `DATABASE_URL` (Postgres)

This package relies heavily on:
- `@tempot/shared` for caching and queues
- `@tempot/event-bus` for syncing data without blocking
- `@tempot/database` for the Postgres persistence layer
