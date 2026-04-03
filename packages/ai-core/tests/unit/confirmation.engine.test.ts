import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConfirmationEngine } from '../../src/confirmation/confirmation.engine.js';
import type { CreateConfirmationOptions } from '../../src/confirmation/confirmation.engine.js';

/** Helper to build default creation options */
function makeOptions(
  overrides: Partial<CreateConfirmationOptions> = {},
): CreateConfirmationOptions {
  return {
    userId: 'user-1',
    toolName: 'delete-record',
    params: { recordId: '42' },
    level: 'simple',
    summary: 'Delete record #42',
    ...overrides,
  };
}

describe('ConfirmationEngine', () => {
  let engine: ConfirmationEngine;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    engine = new ConfirmationEngine();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // --- createConfirmation ---

  describe('createConfirmation', () => {
    it('with simple level returns valid confirmation', () => {
      const result = engine.createConfirmation(makeOptions({ level: 'simple' }));

      expect(result.isOk()).toBe(true);

      const confirmation = result._unsafeUnwrap();
      expect(confirmation.id).toBeDefined();
      expect(confirmation.userId).toBe('user-1');
      expect(confirmation.toolName).toBe('delete-record');
      expect(confirmation.params).toEqual({ recordId: '42' });
      expect(confirmation.level).toBe('simple');
      expect(confirmation.summary).toBe('Delete record #42');
      expect(confirmation.confirmationCode).toBeUndefined();
      expect(confirmation.createdAt).toEqual(new Date('2026-01-01T00:00:00Z'));
      expect(confirmation.expiresAt).toEqual(new Date('2026-01-01T00:05:00Z'));
    });

    it('with detailed level includes details', () => {
      const result = engine.createConfirmation(
        makeOptions({
          level: 'detailed',
          details: 'This will permanently remove the record and all associated data.',
        }),
      );

      expect(result.isOk()).toBe(true);

      const confirmation = result._unsafeUnwrap();
      expect(confirmation.level).toBe('detailed');
      expect(confirmation.details).toBe(
        'This will permanently remove the record and all associated data.',
      );
      expect(confirmation.confirmationCode).toBeUndefined();
    });

    it('with escalated level generates 6-digit code', () => {
      const result = engine.createConfirmation(makeOptions({ level: 'escalated' }));

      expect(result.isOk()).toBe(true);

      const confirmation = result._unsafeUnwrap();
      expect(confirmation.level).toBe('escalated');
      expect(confirmation.confirmationCode).toBeDefined();
      expect(confirmation.confirmationCode).toMatch(/^\d{6}$/);
    });
  });

  // --- confirm ---

  describe('confirm', () => {
    it('with correct simple confirmation succeeds', () => {
      const created = engine.createConfirmation(makeOptions({ level: 'simple' }))._unsafeUnwrap();

      const result = engine.confirm({
        confirmationId: created.id,
        userId: 'user-1',
      });

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap().id).toBe(created.id);
    });

    it('with correct escalated code succeeds', () => {
      const created = engine
        .createConfirmation(makeOptions({ level: 'escalated' }))
        ._unsafeUnwrap();

      const result = engine.confirm({
        confirmationId: created.id,
        userId: 'user-1',
        code: created.confirmationCode,
      });

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap().id).toBe(created.id);
    });

    it('with expired confirmation returns err(CONFIRMATION_EXPIRED)', () => {
      const created = engine.createConfirmation(makeOptions())._unsafeUnwrap();

      // Advance time past the 5-minute TTL
      vi.advanceTimersByTime(5 * 60 * 1000 + 1);

      const result = engine.confirm({
        confirmationId: created.id,
        userId: 'user-1',
      });

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe('ai-core.confirmation.expired');
    });

    it('with wrong userId returns err(CONFIRMATION_REJECTED)', () => {
      const created = engine.createConfirmation(makeOptions())._unsafeUnwrap();

      const result = engine.confirm({
        confirmationId: created.id,
        userId: 'wrong-user',
      });

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe('ai-core.confirmation.rejected');
    });

    it('with wrong code returns err(CONFIRMATION_CODE_INVALID)', () => {
      const created = engine
        .createConfirmation(makeOptions({ level: 'escalated' }))
        ._unsafeUnwrap();

      const result = engine.confirm({
        confirmationId: created.id,
        userId: 'user-1',
        code: '000000',
      });

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe('ai-core.confirmation.code_invalid');
    });

    it('with non-existent confirmationId returns err(CONFIRMATION_EXPIRED)', () => {
      const result = engine.confirm({
        confirmationId: 'non-existent-id',
        userId: 'user-1',
      });

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe('ai-core.confirmation.expired');
    });
  });

  // --- cancel ---

  describe('cancel', () => {
    it('removes confirmation successfully', () => {
      const created = engine.createConfirmation(makeOptions())._unsafeUnwrap();

      const cancelResult = engine.cancel(created.id, 'user-1');
      expect(cancelResult.isOk()).toBe(true);

      // Attempting to confirm the cancelled confirmation should fail
      const confirmResult = engine.confirm({
        confirmationId: created.id,
        userId: 'user-1',
      });
      expect(confirmResult.isErr()).toBe(true);
      expect(confirmResult._unsafeUnwrapErr().code).toBe('ai-core.confirmation.expired');
    });

    it('with wrong userId returns err(CONFIRMATION_REJECTED)', () => {
      const created = engine.createConfirmation(makeOptions())._unsafeUnwrap();

      const result = engine.cancel(created.id, 'wrong-user');

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe('ai-core.confirmation.rejected');
    });

    it('with non-existent confirmationId returns err(CONFIRMATION_EXPIRED)', () => {
      const result = engine.cancel('non-existent-id', 'user-1');

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe('ai-core.confirmation.expired');
    });
  });

  // --- cleanExpired (lazy cleanup) ---

  describe('lazy cleanup', () => {
    it('removes expired entries on next createConfirmation call', () => {
      const created = engine.createConfirmation(makeOptions())._unsafeUnwrap();

      // Advance past expiry
      vi.advanceTimersByTime(5 * 60 * 1000 + 1);

      // Creating a new confirmation triggers cleanup
      engine.createConfirmation(makeOptions({ userId: 'user-2' }));

      // The old confirmation should have been cleaned up
      const confirmResult = engine.confirm({
        confirmationId: created.id,
        userId: 'user-1',
      });
      expect(confirmResult.isErr()).toBe(true);
      expect(confirmResult._unsafeUnwrapErr().code).toBe('ai-core.confirmation.expired');
    });
  });
});
