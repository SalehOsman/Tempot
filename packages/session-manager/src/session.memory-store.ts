import { Session } from './session.types.js';

/** Default maximum entries in the in-memory store to prevent unbounded growth. */
const DEFAULT_MAX_ENTRIES = 10_000;

/** Default TTL in milliseconds (matches DEFAULT_SESSION_TTL in seconds × 1000). */
const DEFAULT_TTL_MS = 86_400_000;

interface MemoryEntry {
  session: Session;
  expiresAt: number;
}

/**
 * In-memory session store for Rule XXXII Redis degradation fallback.
 * Bounded by max entries with TTL-based expiration.
 * NOT shared across processes — ephemeral by design.
 */
export class SessionMemoryStore {
  private readonly store = new Map<string, MemoryEntry>();
  private readonly maxEntries: number;
  private readonly ttlMs: number;

  constructor(maxEntries = DEFAULT_MAX_ENTRIES, ttlMs = DEFAULT_TTL_MS) {
    this.maxEntries = maxEntries;
    this.ttlMs = ttlMs;
  }

  get(key: string): Session | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.session;
  }

  set(key: string, session: Session): void {
    this.evictExpired();
    if (this.store.size >= this.maxEntries) {
      this.evictOldest();
    }
    this.store.set(key, {
      session,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  del(key: string): void {
    this.store.delete(key);
  }

  get size(): number {
    return this.store.size;
  }

  /** Removes all expired entries. */
  private evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) this.store.delete(key);
    }
  }

  /** Removes the oldest entry (first inserted) when at capacity. */
  private evictOldest(): void {
    const firstKey = this.store.keys().next().value;
    if (firstKey !== undefined) this.store.delete(firstKey);
  }
}
