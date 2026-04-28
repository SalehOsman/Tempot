import { describe, expect, it } from 'vitest';
import { NotificationRatePolicy } from '../../src/notification.rate-policy.js';

describe('NotificationRatePolicy', () => {
  it('should keep the first batch within the same second', () => {
    const policy = new NotificationRatePolicy({ maxPerSecond: 30 });

    expect(policy.delayForIndex(0)).toBe(0);
    expect(policy.delayForIndex(29)).toBe(0);
  });

  it('should delay jobs after the Telegram per-second limit', () => {
    const policy = new NotificationRatePolicy({ maxPerSecond: 30 });

    expect(policy.delayForIndex(30)).toBe(1000);
    expect(policy.delayForIndex(60)).toBe(2000);
    expect(policy.delayForIndex(99)).toBe(3000);
  });
});
