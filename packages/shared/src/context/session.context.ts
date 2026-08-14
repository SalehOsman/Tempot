import { AsyncLocalStorage } from 'node:async_hooks';

/** Minimal session data propagated through AsyncLocalStorage for cross-cutting concerns. */
export interface ContextSession {
  userId?: string;
  userRole?: string;
  timezone?: string;
  locale?: string;
  currencyCode?: string;
  countryCode?: string;
  [key: string]: unknown;
}

/** AsyncLocalStorage store that makes `userId` and `userRole` available anywhere in the call stack. */
export const sessionContext = new AsyncLocalStorage<ContextSession>();
