import { describe, it, expect, vi } from 'vitest';
import { ok } from 'neverthrow';
import { guardEnabled } from '../../src/input-engine.guard.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';

describe('guardEnabled', () => {
  it('calls fn and returns its result when enabled is true', async () => {
    const fn = vi.fn().mockResolvedValue(ok('result'));
    const result = await guardEnabled(true, fn);
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBe('result');
    expect(fn).toHaveBeenCalledOnce();
  });

  it('returns err(DISABLED) without calling fn when enabled is false', async () => {
    const fn = vi.fn();
    const result = await guardEnabled(false, fn);
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.DISABLED);
    expect(fn).not.toHaveBeenCalled();
  });
});
