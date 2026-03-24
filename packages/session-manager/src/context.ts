import { AsyncLocalStorage } from 'node:async_hooks';

// We define a minimal Session interface for the context if the main one isn't fully ready,
// or we can import it. The database package expects userId and userRole.
/** Minimal session data propagated through AsyncLocalStorage for cross-cutting concerns. */
export interface ContextSession {
  userId?: string;
  userRole?: string;
  [key: string]: unknown;
}

/** AsyncLocalStorage store that makes `userId` and `userRole` available anywhere in the call stack. */
export const sessionContext = new AsyncLocalStorage<ContextSession>();
