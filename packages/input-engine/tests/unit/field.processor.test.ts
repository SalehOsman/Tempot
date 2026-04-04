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
      expect(externalSpy).toHaveBeenCalledTimes(1);
      expect(replySpy).toHaveBeenCalledTimes(1);
      expect(replySpy).toHaveBeenCalledWith(expect.stringContaining('input-engine.errors'));
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
