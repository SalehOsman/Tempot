import { describe, it, expect, vi } from 'vitest';
import { ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { emitFormResumed } from '../../src/runner/event.emitter.js';
import type { EventEmitterDeps } from '../../src/runner/event.emitter.js';

function createMockDeps(): EventEmitterDeps {
  return {
    eventBus: {
      publish: vi.fn().mockResolvedValue(ok(undefined)),
    },
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    },
  };
}

describe('emitFormResumed', () => {
  it('emits input-engine.form.resumed with correct payload', async () => {
    const deps = createMockDeps();
    const payload = {
      formId: 'test-form',
      userId: 'user-1',
      resumedFromField: 3,
      totalFields: 10,
    };

    await emitFormResumed(deps, payload);

    expect(deps.eventBus.publish).toHaveBeenCalledWith(
      'input-engine.form.resumed',
      expect.objectContaining(payload),
    );
  });

  it('logs warning on publish failure without throwing', async () => {
    const deps = createMockDeps();
    const publishError = new AppError('EVENT_BUS_FAILURE');
    vi.mocked(deps.eventBus.publish).mockResolvedValue(err(publishError));

    const payload = {
      formId: 'test-form',
      userId: 'user-1',
      resumedFromField: 0,
      totalFields: 5,
    };

    await expect(emitFormResumed(deps, payload)).resolves.toBeUndefined();

    expect(deps.logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: 'Event emission failed',
        eventName: 'input-engine.form.resumed',
        errorCode: 'EVENT_BUS_FAILURE',
      }),
    );
  });
});
