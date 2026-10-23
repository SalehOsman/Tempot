import type { ClockProvider } from '@tembot/shared-types';

/**
 * Immutable temporal anchor for deterministic unit and acceptance testing.
 */
export const PINNED_BASE_TIME = new Date('2026-10-23T00:00:00.000Z');

export class TestClock implements ClockProvider {
  private currentTime: Date;

  constructor(initialTime: Date | string = PINNED_BASE_TIME) {
    this.currentTime = typeof initialTime === 'string' ? new Date(initialTime) : initialTime;
  }

  public now(): Date {
    return new Date(this.currentTime.getTime());
  }

  public nowIso(): string {
    return this.currentTime.toISOString();
  }

  public nowEpoch(): number {
    return this.currentTime.getTime();
  }

  public advanceByMs(ms: number): void {
    this.currentTime = new Date(this.currentTime.getTime() + ms);
  }

  public setTime(time: Date | string): void {
    this.currentTime = typeof time === 'string' ? new Date(time) : time;
  }
}

export function createTestClock(initialTime?: Date | string): TestClock {
  return new TestClock(initialTime);
}
