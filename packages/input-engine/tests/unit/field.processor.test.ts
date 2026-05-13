import { describe, it, expect, vi } from 'vitest';
import { ok, err } from 'neverthrow';
import { z } from 'zod';
import { AppError } from '@tempot/shared';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import { FieldHandlerRegistry } from '../../src/fields/field.handler.js';
import type { FieldHandler } from '../../src/fields/field.handler.js';
import type { FieldMetadata } from '../../src/input-engine.types.js';
import type { FormRunnerDeps, FormRunnerInput } from '../../src/runner/form.runner.js';
import {
  processField,
  buildFieldContext,
  type FieldContext,
} from '../../src/runner/field.processor.js';

/** Create mock FormRunnerDeps */
function createMockDeps(overrides?: Partial<FormRunnerDeps>): FormRunnerDeps {
  return {
    registry: new FieldHandlerRegistry(),
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    },
    eventBus: {
      publish: vi.fn().mockResolvedValue(ok(undefined)),
    },
    isEnabled: () => true,
    getActiveConversation: () => undefined,
    setActiveConversation: vi.fn(),
    userId: 'test-user',
    chatId: 12345,
    ...overrides,
  };
}

/** Create a minimal FormRunnerInput */
function createInput(): FormRunnerInput {
  return {
    conversation: {},
    ctx: { message: { text: 'mock-input' } },
    schema: z.object({ name: z.string() }),
  };
}

/** Create a FieldContext for testing processField */
function createFieldContext(
  handler: FieldHandler,
  overrides?: Partial<FieldContext>,
): FieldContext {
  return {
    handler,
    metadata: {
      fieldType: 'ShortText',
      i18nKey: 'form.name',
    } as FieldMetadata,
    fieldSchema: z.string(),
    fieldName: 'name',
    maxRetries: 3,
    formData: {},
    retryCount: 0,
    formId: 'test-form',
    fieldIndex: 1,
    allowCancel: true,
    ...overrides,
  };
}

describe('processField', () => {
  describe('back signal detection', () => {
    it('returns err(NAVIGATE_BACK) when render returns __back__ callback data', async () => {
      const handler: FieldHandler = {
        fieldType: 'ShortText',
        render: vi
          .fn()
          .mockResolvedValue(ok({ callback_query: { data: 'ie:test-form:1:__back__' } })),
        parseResponse: vi.fn().mockReturnValue(ok('value')),
        validate: vi.fn().mockReturnValue(ok('value')),
      };

      const deps = createMockDeps();
      const ctx = createFieldContext(handler);
      const input = createInput();
      const result = await processField(input, ctx, deps);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.NAVIGATE_BACK);
      expect(result._unsafeUnwrapErr().details).toMatchObject({
        fieldName: 'name',
      });
      // parseResponse should NOT have been called — back detected before parsing
      expect(handler.parseResponse).not.toHaveBeenCalled();
    });

    it('back signal takes priority over parse/validate (not consumed as invalid input)', async () => {
      // This test verifies the core bug: __back__ callback should NOT fall through
      // to tryParseAndValidate and increment retryCount
      const handler: FieldHandler = {
        fieldType: 'ShortText',
        render: vi
          .fn()
          .mockResolvedValue(ok({ callback_query: { data: 'ie:test-form:1:__back__' } })),
        parseResponse: vi
          .fn()
          .mockReturnValue(err(new AppError(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED))),
        validate: vi.fn().mockReturnValue(ok('value')),
      };

      const deps = createMockDeps();
      const ctx = createFieldContext(handler);
      const input = createInput();
      const result = await processField(input, ctx, deps);

      // Should return NAVIGATE_BACK, not retry
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.NAVIGATE_BACK);
      // parseResponse should NOT have been called at all
      expect(handler.parseResponse).not.toHaveBeenCalled();
    });

    it('cancel signal still takes priority over back signal', async () => {
      // If response somehow has both cancel and back data, cancel wins
      // because checkCancelSignal runs before isBackSignal
      const handler: FieldHandler = {
        fieldType: 'ShortText',
        render: vi
          .fn()
          .mockResolvedValue(ok({ callback_query: { data: 'ie:test-form:1:__cancel__' } })),
        parseResponse: vi.fn().mockReturnValue(ok('value')),
        validate: vi.fn().mockReturnValue(ok('value')),
      };

      const deps = createMockDeps();
      const ctx = createFieldContext(handler, { allowCancel: true });
      const input = createInput();
      const result = await processField(input, ctx, deps);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FORM_CANCELLED);
    });

    it('cancels and acknowledges when render returns grammY callback context', async () => {
      const answerCallbackQuery = vi.fn().mockResolvedValue(true);
      const handler: FieldHandler = {
        fieldType: 'ShortText',
        render: vi.fn().mockResolvedValue(
          ok({
            callbackQuery: { data: 'ie:test-form:1:__cancel__' },
            answerCallbackQuery,
          }),
        ),
        parseResponse: vi.fn().mockReturnValue(ok('value')),
        validate: vi.fn().mockReturnValue(ok('value')),
      };

      const deps = createMockDeps();
      const ctx = createFieldContext(handler, { allowCancel: true });
      const input = createInput();
      const result = await processField(input, ctx, deps);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FORM_CANCELLED);
      expect(answerCallbackQuery).toHaveBeenCalledTimes(1);
      expect(handler.parseResponse).not.toHaveBeenCalled();
    });

    it('continues processing back when callback acknowledgement does not resolve', async () => {
      vi.useFakeTimers();
      const answerCallbackQuery = vi.fn().mockReturnValue(new Promise(() => undefined));
      const handler: FieldHandler = {
        fieldType: 'ShortText',
        render: vi.fn().mockResolvedValue(
          ok({
            callbackQuery: { data: 'ie:test-form:1:__back__' },
            answerCallbackQuery,
          }),
        ),
        parseResponse: vi.fn().mockReturnValue(ok('value')),
        validate: vi.fn().mockReturnValue(ok('value')),
      };

      const deps = createMockDeps();
      const ctx = createFieldContext(handler);
      const resultPromise = processField(createInput(), ctx, deps);

      await vi.advanceTimersByTimeAsync(1_500);
      const result = await resultPromise;

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.NAVIGATE_BACK);
      expect(deps.logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'input-engine.callback_ack_timeout' }),
      );
      vi.useRealTimers();
    });

    it('continues processing cancel when callback acknowledgement does not resolve', async () => {
      vi.useFakeTimers();
      const answerCallbackQuery = vi.fn().mockReturnValue(new Promise(() => undefined));
      const handler: FieldHandler = {
        fieldType: 'ShortText',
        render: vi.fn().mockResolvedValue(
          ok({
            callbackQuery: { data: 'ie:test-form:1:__cancel__' },
            answerCallbackQuery,
          }),
        ),
        parseResponse: vi.fn().mockReturnValue(ok('value')),
        validate: vi.fn().mockReturnValue(ok('value')),
      };

      const deps = createMockDeps();
      const ctx = createFieldContext(handler);
      const resultPromise = processField(createInput(), ctx, deps);

      await vi.advanceTimersByTimeAsync(1_500);
      const result = await resultPromise;

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FORM_CANCELLED);
      expect(deps.logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'input-engine.callback_ack_timeout' }),
      );
      vi.useRealTimers();
    });

    it('does not overlap conversation.external work when callback acknowledgement times out', async () => {
      vi.useFakeTimers();
      let externalActive = false;
      const external = vi.fn(
        async <T>(task: () => Promise<T> | T): Promise<T> => {
          if (externalActive) throw new Error('overlapping external work');
          externalActive = true;
          try {
            return await task();
          } finally {
            externalActive = false;
          }
        },
      );
      const answerCallbackQuery = vi.fn().mockReturnValue(new Promise(() => undefined));
      const handler: FieldHandler = {
        fieldType: 'ShortText',
        render: vi.fn().mockResolvedValue(
          ok({
            callbackQuery: { data: 'ie:test-form:1:__cancel__' },
            answerCallbackQuery,
          }),
        ),
        parseResponse: vi.fn().mockReturnValue(ok('value')),
        validate: vi.fn().mockReturnValue(ok('value')),
      };
      const deps = createMockDeps();
      const input: FormRunnerInput = {
        conversation: { external },
        ctx: { message: { text: 'mock-input' } },
        schema: z.object({ name: z.string() }),
      };
      const resultPromise = processField(input, createFieldContext(handler), deps);

      await vi.advanceTimersByTimeAsync(1_500);
      const result = await resultPromise;

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FORM_CANCELLED);
      expect(externalActive).toBe(false);
      expect(external).toHaveBeenCalledTimes(2);
      vi.useRealTimers();
    });

    it('non-back callback data is processed normally (no false positive)', async () => {
      const handler: FieldHandler = {
        fieldType: 'ShortText',
        render: vi
          .fn()
          .mockResolvedValue(ok({ callback_query: { data: 'ie:test-form:1:some_value' } })),
        parseResponse: vi.fn().mockReturnValue(ok('parsed')),
        validate: vi.fn().mockReturnValue(ok('parsed')),
      };

      const deps = createMockDeps();
      const ctx = createFieldContext(handler);
      const input = createInput();
      const result = await processField(input, ctx, deps);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('parsed');
      expect(handler.parseResponse).toHaveBeenCalled();
    });
  });

  describe('validation error display (I1)', () => {
    it('sends validation error text to user via conversation.external + ctx.reply', async () => {
      const replySpy = vi.fn().mockResolvedValue(undefined);
      const externalSpy = vi
        .fn()
        .mockImplementation(async <T>(fn: () => Promise<T>): Promise<T> => fn());

      let callCount = 0;
      const handler: FieldHandler = {
        fieldType: 'ShortText',
        render: vi.fn().mockResolvedValue(ok({ message: { text: 'bad-input' } })),
        parseResponse: vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount <= 1) {
            return err(new AppError(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED));
          }
          return ok('valid');
        }),
        validate: vi.fn().mockReturnValue(ok('valid')),
      };

      const deps = createMockDeps({
        t: (key: string, params?: Record<string, unknown>) => `${key}:${JSON.stringify(params)}`,
      });
      const ctx = createFieldContext(handler, { maxRetries: 3 });
      const input: FormRunnerInput = {
        conversation: { external: externalSpy },
        ctx: { message: { text: 'bad-input' }, reply: replySpy },
        schema: z.object({ name: z.string() }),
      };

      const result = await processField(input, ctx, deps);

      expect(result.isOk()).toBe(true);
      expect(externalSpy).toHaveBeenCalledTimes(4);
      expect(replySpy).toHaveBeenCalledTimes(1);
      expect(replySpy).toHaveBeenCalledWith(expect.stringContaining('input-engine.errors'));
    });

    it('preserves conversation.external binding when sending validation feedback', async () => {
      const replySpy = vi.fn().mockResolvedValue(undefined);
      const externalCalls = vi.fn();
      const conversation = {
        insideExternal: false,
        async external<T>(this: { insideExternal: boolean }, fn: () => Promise<T>): Promise<T> {
          externalCalls();
          this.insideExternal = true;
          const value = await fn();
          this.insideExternal = false;
          return value;
        },
      };

      let callCount = 0;
      const handler: FieldHandler = {
        fieldType: 'ShortText',
        render: vi.fn().mockResolvedValue(ok({ message: { text: 'bad-input' } })),
        parseResponse: vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount <= 1) {
            return err(new AppError(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED));
          }
          return ok('valid');
        }),
        validate: vi.fn().mockReturnValue(ok('valid')),
      };

      const deps = createMockDeps({
        t: (key: string, params?: Record<string, unknown>) => `${key}:${JSON.stringify(params)}`,
      });
      const ctx = createFieldContext(handler, { maxRetries: 3 });
      const input: FormRunnerInput = {
        conversation,
        ctx: { message: { text: 'bad-input' }, reply: replySpy },
        schema: z.object({ name: z.string() }),
      };

      const result = await processField(input, ctx, deps);

      expect(result.isOk()).toBe(true);
      expect(externalCalls).toHaveBeenCalledTimes(4);
      expect(replySpy).toHaveBeenCalledTimes(1);
      expect(conversation.insideExternal).toBe(false);
    });

    it('preserves ctx.reply binding when sending validation feedback', async () => {
      const replyContext = {
        message: { text: 'bad-input' },
        msg: { chat: { id: 12345 } },
        replies: [] as string[],
        async reply(this: { msg: unknown; replies: string[] }, text: string): Promise<unknown> {
          if (!this.msg) throw new Error('missing reply binding');
          this.replies.push(text);
          return undefined;
        },
      };
      const externalSpy = vi
        .fn()
        .mockImplementation(async <T>(fn: () => Promise<T>): Promise<T> => fn());

      let callCount = 0;
      const handler: FieldHandler = {
        fieldType: 'ShortText',
        render: vi.fn().mockResolvedValue(ok({ message: { text: 'bad-input' } })),
        parseResponse: vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount <= 1) {
            return err(new AppError(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED));
          }
          return ok('valid');
        }),
        validate: vi.fn().mockReturnValue(ok('valid')),
      };

      const deps = createMockDeps({
        t: (key: string, params?: Record<string, unknown>) => `${key}:${JSON.stringify(params)}`,
      });
      const ctx = createFieldContext(handler, { maxRetries: 3 });
      const input: FormRunnerInput = {
        conversation: { external: externalSpy },
        ctx: replyContext,
        schema: z.object({ name: z.string() }),
      };

      const result = await processField(input, ctx, deps);

      expect(result.isOk()).toBe(true);
      expect(externalSpy).toHaveBeenCalledTimes(4);
      expect(replyContext.replies).toHaveLength(1);
      expect(replyContext.replies[0]).toContain('input-engine.errors');
    });

    it('does not crash when conversation.external is unavailable', async () => {
      const handler: FieldHandler = {
        fieldType: 'ShortText',
        render: vi.fn().mockResolvedValue(ok({ message: { text: 'bad' } })),
        parseResponse: vi
          .fn()
          .mockReturnValue(err(new AppError(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED))),
        validate: vi.fn().mockReturnValue(ok('v')),
      };

      const deps = createMockDeps();
      const ctx = createFieldContext(handler, { maxRetries: 1 });
      const input: FormRunnerInput = {
        conversation: {},
        ctx: { message: { text: 'bad' } },
        schema: z.object({ name: z.string() }),
      };

      const result = await processField(input, ctx, deps);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_MAX_RETRIES);
    });

    it('does not crash when ctx.reply is unavailable', async () => {
      const externalSpy = vi
        .fn()
        .mockImplementation(async <T>(fn: () => Promise<T>): Promise<T> => fn());
      const handler: FieldHandler = {
        fieldType: 'ShortText',
        render: vi.fn().mockResolvedValue(ok({ message: { text: 'bad' } })),
        parseResponse: vi
          .fn()
          .mockReturnValue(err(new AppError(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED))),
        validate: vi.fn().mockReturnValue(ok('v')),
      };

      const deps = createMockDeps();
      const ctx = createFieldContext(handler, { maxRetries: 1 });
      const input: FormRunnerInput = {
        conversation: { external: externalSpy },
        ctx: { message: { text: 'bad' } },
        schema: z.object({ name: z.string() }),
      };

      const result = await processField(input, ctx, deps);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_MAX_RETRIES);
    });
  });

  describe('field lifecycle diagnostics', () => {
    it('logs field start and validation success', async () => {
      const handler: FieldHandler = {
        fieldType: 'ShortText',
        render: vi.fn().mockResolvedValue(ok({ callback_query: { data: 'value' } })),
        parseResponse: vi.fn().mockReturnValue(ok('parsed')),
        validate: vi.fn().mockReturnValue(ok('parsed')),
      };
      const deps = createMockDeps();
      const result = await processField(createInput(), createFieldContext(handler), deps);

      expect(result.isOk()).toBe(true);
      expect(deps.logger.debug).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'input-engine.field_started', fieldName: 'name' }),
      );
      expect(deps.logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'input-engine.field_validated', fieldName: 'name' }),
      );
    });

    it('runs lifecycle logs through conversation.external when available', async () => {
      const externalSpy = vi
        .fn()
        .mockImplementation(async <T>(fn: () => T | Promise<T>): Promise<T> => fn());
      const handler: FieldHandler = {
        fieldType: 'ShortText',
        render: vi.fn().mockResolvedValue(ok({ callback_query: { data: 'value' } })),
        parseResponse: vi.fn().mockReturnValue(ok('parsed')),
        validate: vi.fn().mockReturnValue(ok('parsed')),
      };
      const deps = createMockDeps();
      const input: FormRunnerInput = {
        conversation: { external: externalSpy },
        ctx: { message: { text: 'mock-input' } },
        schema: z.object({ name: z.string() }),
      };

      const result = await processField(input, createFieldContext(handler), deps);

      expect(result.isOk()).toBe(true);
      expect(externalSpy).toHaveBeenCalledTimes(2);
      expect(deps.logger.debug).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'input-engine.field_started', fieldName: 'name' }),
      );
      expect(deps.logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'input-engine.field_validated', fieldName: 'name' }),
      );
    });

    it('logs keep-current control action when previous value is reused', async () => {
      const handler: FieldHandler = {
        fieldType: 'ShortText',
        render: vi
          .fn()
          .mockResolvedValue(ok({ callback_query: { data: 'ie:test-form:1:__keep_current__' } })),
        parseResponse: vi.fn().mockReturnValue(ok('value')),
        validate: vi.fn().mockReturnValue(ok('value')),
      };
      const deps = createMockDeps();
      const ctx = createFieldContext(handler, { previousValue: 'previous' });

      const result = await processField(createInput(), ctx, deps);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('previous');
      expect(deps.logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'input-engine.field_keep_current', fieldName: 'name' }),
      );
      expect(handler.parseResponse).not.toHaveBeenCalled();
    });

    it('logs cancel and back control actions', async () => {
      const cancelHandler: FieldHandler = {
        fieldType: 'ShortText',
        render: vi
          .fn()
          .mockResolvedValue(ok({ callback_query: { data: 'ie:test-form:1:__cancel__' } })),
        parseResponse: vi.fn().mockReturnValue(ok('value')),
        validate: vi.fn().mockReturnValue(ok('value')),
      };
      const backHandler: FieldHandler = {
        fieldType: 'ShortText',
        render: vi
          .fn()
          .mockResolvedValue(ok({ callback_query: { data: 'ie:test-form:1:__back__' } })),
        parseResponse: vi.fn().mockReturnValue(ok('value')),
        validate: vi.fn().mockReturnValue(ok('value')),
      };
      const deps = createMockDeps();

      await processField(createInput(), createFieldContext(cancelHandler), deps);
      await processField(createInput(), createFieldContext(backHandler), deps);

      expect(deps.logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'input-engine.field_cancelled', fieldName: 'name' }),
      );
      expect(deps.logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'input-engine.field_back', fieldName: 'name' }),
      );
    });

    it('logs validation failure and max retries', async () => {
      const handler: FieldHandler = {
        fieldType: 'ShortText',
        render: vi.fn().mockResolvedValue(ok({ message: { text: 'bad' } })),
        parseResponse: vi
          .fn()
          .mockReturnValue(err(new AppError(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED))),
        validate: vi.fn().mockReturnValue(ok('unused')),
      };
      const deps = createMockDeps();
      const result = await processField(
        createInput(),
        createFieldContext(handler, { maxRetries: 1 }),
        deps,
      );

      expect(result.isErr()).toBe(true);
      expect(deps.logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'input-engine.field_validation_failed',
          attempt: 1,
          maxRetries: 1,
        }),
      );
      expect(deps.logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'input-engine.field_max_retries', maxRetries: 1 }),
      );
    });
  });
});

describe('buildFieldContext', () => {
  it('returns ok(FieldContext) when handler exists', () => {
    const handler: FieldHandler = {
      fieldType: 'ShortText',
      render: vi.fn().mockResolvedValue(ok(undefined)),
      parseResponse: vi.fn().mockReturnValue(ok('v')),
      validate: vi.fn().mockReturnValue(ok('v')),
    };
    const deps = createMockDeps();
    deps.registry.register(handler);

    const result = buildFieldContext(
      deps,
      { formData: {}, formId: 'f1' },
      {
        fieldName: 'name',
        metadata: { fieldType: 'ShortText', i18nKey: 'form.name' } as FieldMetadata,
        fieldSchema: z.string(),
        fieldIndex: 0,
      },
    );

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap().fieldName).toBe('name');
  });

  it('returns err(FIELD_TYPE_UNKNOWN) when handler is missing', () => {
    const deps = createMockDeps();

    const result = buildFieldContext(
      deps,
      { formData: {}, formId: 'f1' },
      {
        fieldName: 'name',
        metadata: { fieldType: 'ShortText', i18nKey: 'form.name' } as FieldMetadata,
        fieldSchema: z.string(),
        fieldIndex: 0,
      },
    );

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_TYPE_UNKNOWN);
  });
});
