import { AsyncLocalStorage } from 'node:async_hooks';

// We define a minimal Session interface for the context if the main one isn't fully ready,
// or we can import it. The database package expects userId and userRole.
export interface ContextSession {
  userId?: string;
  userRole?: string;
  [key: string]: unknown;
}

export const sessionContext = new AsyncLocalStorage<ContextSession>();
