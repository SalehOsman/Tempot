import type { NotificationRatePolicyOptions } from './notifier.types.js';

const DEFAULT_MAX_PER_SECOND = 30;
const SECOND_MS = 1000;

export class NotificationRatePolicy {
  private readonly maxPerSecond: number;

  constructor(options: NotificationRatePolicyOptions = {}) {
    this.maxPerSecond = options.maxPerSecond ?? DEFAULT_MAX_PER_SECOND;
  }

  delayForIndex(index: number): number {
    return Math.floor(index / this.maxPerSecond) * SECOND_MS;
  }
}
