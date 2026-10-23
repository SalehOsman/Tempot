/**
 * Sovereign Cache Invalidation Contract for Distributed Multi-Pod Deployments.
 * Allows instant cache eviction via Redis Pub/Sub without waiting for in-memory TTL expiration.
 */
export interface CacheInvalidator {
  /**
   * Publishes an invalidation message on the designated channel.
   */
  publishInvalidate(channel: string, payload: string): Promise<void>;

  /**
   * Subscribes to the invalidation channel and invokes callback on incoming messages.
   */
  subscribeInvalidate(
    channel: string,
    onInvalidate: (payload: string) => void,
  ): Promise<void> | void;
}
