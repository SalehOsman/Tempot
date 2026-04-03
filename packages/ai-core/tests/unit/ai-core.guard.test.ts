import { describe, it, expect, vi } from 'vitest';
import { ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { guardEnabled } from '../../src/ai-core.guard.js';
import { AI_ERRORS } from '../../src/ai-core.errors.js';

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
    expect(result._unsafeUnwrapErr().code).toBe(AI_ERRORS.DISABLED);
    expect(fn).not.toHaveBeenCalled();
  });

  it('propagates fn error when enabled is true', async () => {
    const fn = vi.fn().mockResolvedValue(err(new AppError('test.error')));
    const result = await guardEnabled(true, fn);
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('test.error');
  });

  it('does not initialize provider when disabled', async () => {
    const providerInit = vi.fn();
    const fn = vi.fn().mockImplementation(async () => {
      providerInit();
      return ok('initialized');
    });
    const result = await guardEnabled(false, fn);
    expect(result.isErr()).toBe(true);
    expect(providerInit).not.toHaveBeenCalled();
  });
});
