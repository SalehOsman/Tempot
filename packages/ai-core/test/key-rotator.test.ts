import { describe, expect, it } from 'vitest';
import { ApiKeyRotator } from '../src/key-rotator.js';

describe('ApiKeyRotator Specification', () => {
  it('throws an error if initialized with empty key pool', () => {
    expect(() => {
      new ApiKeyRotator({ provider: 'gemini', keys: [] });
    }).toThrow('must have at least one key');
  });

  it('rotates to next key when encountering HTTP 429 rate limit', async () => {
    const keysUsed: string[] = [];
    const rotator = new ApiKeyRotator({
      provider: 'gemini',
      keys: ['key-1', 'key-2', 'key-3'],
      cooldownMs: 5000,
    });

    const result = await rotator.executeWithRotation(async (key) => {
      keysUsed.push(key);
      if (key === 'key-1') {
        throw Object.assign(new Error('Resource exhausted'), { status: 429 });
      }
      return `success-from-${key}`;
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toBe('success-from-key-2');
    }
    expect(keysUsed).toEqual(['key-1', 'key-2']);
  });

  it('returns RateLimitedError when all keys in pool are exhausted', async () => {
    const rotator = new ApiKeyRotator({
      provider: 'deepseek',
      keys: ['key-a', 'key-b'],
      cooldownMs: 60000,
    });

    const result = await rotator.executeWithRotation(async (_key) => {
      throw Object.assign(new Error('rate limit reached'), { status: 429 });
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe('RATE_LIMITED');
      expect(result.error.message).toContain(
        "All 2 API keys for provider 'deepseek' are exhausted",
      );
    }
  });

  it('does not exhaust key on non-quota errors (e.g. invalid prompt)', async () => {
    const rotator = new ApiKeyRotator({
      provider: 'gemini',
      keys: ['healthy-key'],
    });

    const result = await rotator.executeWithRotation(async (_key) => {
      throw new Error('Invalid prompt argument format');
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toContain('Invalid prompt argument format');
    }
  });
});
