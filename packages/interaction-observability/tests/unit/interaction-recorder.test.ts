import { AppError } from '@tempot/shared';
import { err, ok } from 'neverthrow';
import { describe, expect, it, vi } from 'vitest';
import {
  InteractionRecorder,
  createInteractionTrace,
  getInteractionTrace,
  recordInteractionStep,
  setInteractionRecorder,
  setInteractionTrace,
  toInteractionTraceLog,
  type InteractionEvent,
} from '../../src/index.js';

function createLogger() {
  return {
    warn: vi.fn(),
    debug: vi.fn(),
  };
}

function createTrace() {
  return createInteractionTrace({
    traceId: 'trace-1',
    updateId: 10,
    updateType: 'callback_query',
    callbackData: 'settings:regional:timezone',
    callbackNamespace: 'settings',
    module: 'settings-management',
    userId: 123,
    chatId: 456,
    startedAt: 1_000,
  });
}

describe('InteractionRecorder', () => {
  it('persists events with trace metadata and monotonic sequence numbers', async () => {
    const sink = { write: vi.fn().mockResolvedValue(ok(undefined)) };
    const recorder = new InteractionRecorder({ sink, logger: createLogger() });
    const trace = createTrace();

    const first = await recorder.record(trace, {
      stage: 'received',
      status: 'received',
      action: 'settings:regional:timezone',
      viewKey: 'settings-management.view.regional_timezone',
    });
    const second = await recorder.record(trace, {
      stage: 'edit_noop',
      status: 'skipped',
      action: 'settings:regional:timezone',
      reason: 'message_not_modified',
    });

    expect(first.isOk()).toBe(true);
    expect(second.isOk()).toBe(true);
    expect(trace.eventCount).toBe(2);
    expect(sink.write).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        traceId: 'trace-1',
        sequence: 1,
        updateId: 10,
        updateType: 'callback_query',
        callbackData: 'settings:regional:timezone',
        callbackNamespace: 'settings',
        module: 'settings-management',
        userId: '123',
        chatId: '456',
        stage: 'received',
        status: 'received',
        action: 'settings:regional:timezone',
        viewKey: 'settings-management.view.regional_timezone',
      }) satisfies Partial<InteractionEvent>,
    );
    expect(sink.write).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        traceId: 'trace-1',
        sequence: 2,
        stage: 'edit_noop',
        status: 'skipped',
        reason: 'message_not_modified',
      }) satisfies Partial<InteractionEvent>,
    );
  });

  it('stores recorder and trace on generic contexts', async () => {
    const sink = { write: vi.fn().mockResolvedValue(ok(undefined)) };
    const recorder = new InteractionRecorder({ sink, logger: createLogger() });
    const trace = createTrace();
    const ctx: Record<string, unknown> = {};

    setInteractionTrace(ctx, trace);
    setInteractionRecorder(ctx, recorder);

    const result = await recordInteractionStep(ctx, {
      stage: 'view_rendered',
      status: 'succeeded',
      action: 'settings:regional:timezone',
    });

    expect(result.isOk()).toBe(true);
    expect(getInteractionTrace(ctx)).toBe(trace);
    expect(sink.write).toHaveBeenCalledOnce();
  });

  it('treats missing context recorder as a successful no-op', async () => {
    const trace = createTrace();
    const ctx: Record<string, unknown> = {};
    setInteractionTrace(ctx, trace);

    const result = await recordInteractionStep(ctx, {
      stage: 'completed',
      status: 'completed',
      action: 'settings:regional:timezone',
    });

    expect(result.isOk()).toBe(true);
    expect(trace.eventCount).toBe(0);
  });

  it('returns sink errors without throwing and logs the persistence failure', async () => {
    const error = new AppError('database.interaction_event_create_failed');
    const logger = createLogger();
    const sink = { write: vi.fn().mockResolvedValue(err(error)) };
    const recorder = new InteractionRecorder({ sink, logger });

    const result = await recorder.record(createTrace(), {
      stage: 'failed',
      status: 'failed',
      action: 'settings:regional:timezone',
      reason: 'handler_failed',
    });

    expect(result.isErr()).toBe(true);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'interaction-observability.event_persist_failed',
        error: 'database.interaction_event_create_failed',
        traceId: 'trace-1',
      }),
    );
  });

  it('serializes traces for structured logs', () => {
    expect(toInteractionTraceLog(createTrace())).toEqual({
      traceId: 'trace-1',
      updateId: 10,
      updateType: 'callback_query',
      command: undefined,
      callbackData: 'settings:regional:timezone',
      callbackNamespace: 'settings',
      module: 'settings-management',
      userId: 123,
      chatId: 456,
      responseCount: 0,
      eventCount: 0,
      lastResponseType: undefined,
    });
  });
});
