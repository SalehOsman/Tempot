import { Redis } from 'ioredis';

export interface ConnectionWatcherOptions {
  intervalMs: number;
  stabilizationThreshold: number;
}

/**
 * Monitors Redis connection health and manages auto-recovery state.
 * Rule: Rule XXXII (Degradation)
 */
export class ConnectionWatcher {
  private redis: Redis;
  private intervalMs: number;
  private stabilizationThreshold: number;
  private consecutiveSuccesses = 0;
  private isAvailable = false;
  private timer: NodeJS.Timeout | null = null;
  private statusCallback: ((isAvailable: boolean) => void) | null = null;

  constructor(redis: Redis, options: ConnectionWatcherOptions) {
    this.redis = redis;
    this.intervalMs = options.intervalMs;
    this.stabilizationThreshold = options.stabilizationThreshold;
  }

  /**
   * Starts the monitoring loop.
   */
  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.check(), this.intervalMs);
  }

  /**
   * Stops the monitoring loop.
   */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Returns current Redis availability.
   */
  isRedisAvailable(): boolean {
    return this.isAvailable;
  }

  /**
   * Registers a callback for status changes.
   */
  onStatusChange(callback: (isAvailable: boolean) => void): void {
    this.statusCallback = callback;
  }

  /**
   * Performs a pulse check by pinging Redis.
   */
  private async check(): Promise<void> {
    try {
      const result = await this.redis.ping();
      if (result === 'PONG') {
        this.handleSuccess();
      } else {
        this.handleFailure();
      }
    } catch {
      this.handleFailure();
    }
  }

  private handleSuccess(): void {
    if (this.isAvailable) {
      this.consecutiveSuccesses = this.stabilizationThreshold;
      return;
    }

    this.consecutiveSuccesses++;
    if (this.consecutiveSuccesses >= this.stabilizationThreshold) {
      this.setStatus(true);
    }
  }

  private handleFailure(): void {
    this.consecutiveSuccesses = 0;
    if (this.isAvailable) {
      this.setStatus(false);
    }
  }

  private setStatus(available: boolean): void {
    if (this.isAvailable === available) return;
    this.isAvailable = available;
    if (this.statusCallback) {
      this.statusCallback(available);
    }
  }
}
