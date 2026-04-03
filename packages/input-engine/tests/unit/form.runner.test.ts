import { describe, it, expect, vi } from 'vitest';
import { ok, err } from 'neverthrow';
import { z } from 'zod';
import { AppError } from '@tempot/shared';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import { FieldHandlerRegistry } from '../../src/fields/field.handler.js';
import type { FieldHandler } from '../../src/fields/field.handler.js';
import type { FieldMetadata, FieldType } from '../../src/input-engine.types.js';
import type { FormRunnerDeps, FormRunnerInput } from '../../src/runner/form.runner.js';
import { runForm } from '../../src/runner/form.runner.js';
import type { ConversationsStorageAdapter } from '../../src/storage/conversations-storage.adapter.js';

/** Register field metadata on a Zod schema instance via z.globalRegistry */
function registerField(schema: z.ZodType, metadata: FieldMetadata): z.ZodType {
  z.globalRegistry.add(schema, { 'input-engine': metadata });
  return schema;
}

/** Create a mock FieldHandler that returns ok values */
function createMockHandler(
  fieldType: FieldType,
  returnValue: unknown = 'test-value',
): FieldHandler {
  return {
    fieldType,
    render: vi.fn().mockResolvedValue(ok(undefined)),
    parseResponse: vi.fn().mockReturnValue(ok(returnValue)),
    validate: vi.fn().mockReturnValue(ok(returnValue)),
  };
}

/** Create mock FormRunnerDeps with optional overrides */
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

/** Create a FormRunnerInput for a given schema */
function createInput(schema: z.ZodObject<z.ZodRawShape>): FormRunnerInput {
  return {
    conversation: {},
    ctx: { message: { text: 'mock-input' } },
    schema,
  };
}

describe('FormRunner (runForm)', () => {
  it('returns err(DISABLED) when toggle is off', async () => {
    const deps = createMockDeps({ isEnabled: () => false });
    const input = createInput(z.object({}));

    const result = await runForm(input, deps);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(INPUT_ENGINE_ERRORS.DISABLED);
    }
  });

  it('returns err(SCHEMA_INVALID) for invalid schema', async () => {
    const fieldSchema = registerField(z.string(), {
      fieldType: 'ShortText',
      i18nKey: '',
    } as FieldMetadata);
    const schema = z.object({ name: fieldSchema });

    const deps = createMockDeps();
    deps.registry.register(createMockHandler('ShortText'));

    const result = await runForm(createInput(schema), deps);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(INPUT_ENGINE_ERRORS.SCHEMA_INVALID);
    }
  });

  it('returns err(FORM_ALREADY_ACTIVE) when session has activeConversation', async () => {
    const fieldSchema = registerField(z.string(), {
      fieldType: 'ShortText',
      i18nKey: 'form.name',
    } as FieldMetadata);
    const schema = z.object({ name: fieldSchema });

    const deps = createMockDeps({
      getActiveConversation: () => 'existing-form-id',
    });
    deps.registry.register(createMockHandler('ShortText'));

    const result = await runForm(createInput(schema), deps);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(INPUT_ENGINE_ERRORS.FORM_ALREADY_ACTIVE);
    }
  });

  it('successfully runs a simple 2-field form', async () => {
    const nameSchema = registerField(z.string(), {
      fieldType: 'ShortText',
      i18nKey: 'form.name',
    } as FieldMetadata);
    const emailSchema = registerField(z.string(), {
      fieldType: 'Email',
      i18nKey: 'form.email',
    } as FieldMetadata);
    const schema = z.object({
      name: nameSchema,
      email: emailSchema,
    });

    const deps = createMockDeps();
    deps.registry.register(createMockHandler('ShortText', 'John'));
    deps.registry.register(createMockHandler('Email', 'john@example.com'));

    const result = await runForm<{ name: string; email: string }>(createInput(schema), deps);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual({
        name: 'John',
        email: 'john@example.com',
      });
    }

    // Verify session lifecycle: set then clear
    const setMock = deps.setActiveConversation as ReturnType<typeof vi.fn>;
    expect(setMock).toHaveBeenCalledTimes(2);
    expect(setMock.mock.calls[0]?.[0]).toBeTruthy();
    expect(setMock.mock.calls[1]?.[0]).toBeUndefined();
  });

  it('skips conditional fields when condition is not met', async () => {
    const catSchema = registerField(z.string(), {
      fieldType: 'ShortText',
      i18nKey: 'form.category',
    } as FieldMetadata);
    const detailSchema = registerField(z.string(), {
      fieldType: 'LongText',
      i18nKey: 'form.detail',
      conditions: [
        {
          dependsOn: 'category',
          operator: 'equals' as const,
          value: 'other',
        },
      ],
    } as FieldMetadata);
    const schema = z.object({
      category: catSchema,
      detail: detailSchema,
    });

    const detailHandler = createMockHandler('LongText', 'some-detail');
    const deps = createMockDeps();
    deps.registry.register(createMockHandler('ShortText', 'not-other'));
    deps.registry.register(detailHandler);

    const result = await runForm<{ category: string }>(createInput(schema), deps);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual({ category: 'not-other' });
    }
    expect(detailHandler.render).not.toHaveBeenCalled();
  });

  it('emits form.started and form.completed events on success', async () => {
    const nameSchema = registerField(z.string(), {
      fieldType: 'ShortText',
      i18nKey: 'form.name',
    } as FieldMetadata);
    const schema = z.object({ name: nameSchema });

    const deps = createMockDeps();
    deps.registry.register(createMockHandler('ShortText', 'test'));

    await runForm(createInput(schema), deps);

    const pub = deps.eventBus.publish as ReturnType<typeof vi.fn>;
    const events = pub.mock.calls.map((c: unknown[]) => c[0]) as string[];

    expect(events).toContain('input-engine.form.started');
    expect(events).toContain('input-engine.form.completed');

    // Verify started payload
    const started = pub.mock.calls.find(
      (c: unknown[]) => c[0] === 'input-engine.form.started',
    ) as unknown[];
    const sp = started[1] as Record<string, unknown>;
    expect(sp).toMatchObject({
      userId: 'test-user',
      chatId: 12345,
      fieldCount: 1,
    });
    expect(sp['formId']).toBeTruthy();
    expect(sp['timestamp']).toBeInstanceOf(Date);

    // Verify completed payload
    const completed = pub.mock.calls.find(
      (c: unknown[]) => c[0] === 'input-engine.form.completed',
    ) as unknown[];
    const cp = completed[1] as Record<string, unknown>;
    expect(cp).toMatchObject({
      userId: 'test-user',
      fieldCount: 1,
      hadPartialSave: false,
    });
    expect(cp['formId']).toBeTruthy();
    expect(cp['durationMs']).toBeGreaterThanOrEqual(0);
  });

  it('emits form.cancelled when user cancel is triggered', async () => {
    const nameSchema = registerField(z.string(), {
      fieldType: 'ShortText',
      i18nKey: 'form.name',
    } as FieldMetadata);
    const emailSchema = registerField(z.string(), {
      fieldType: 'Email',
      i18nKey: 'form.email',
    } as FieldMetadata);
    const schema = z.object({
      name: nameSchema,
      email: emailSchema,
    });

    const emailHandler: FieldHandler = {
      fieldType: 'Email',
      render: vi.fn().mockResolvedValue(err(new AppError(INPUT_ENGINE_ERRORS.FORM_CANCELLED))),
      parseResponse: vi.fn().mockReturnValue(ok('unused')),
      validate: vi.fn().mockReturnValue(ok('unused')),
    };

    const deps = createMockDeps();
    deps.registry.register(createMockHandler('ShortText', 'John'));
    deps.registry.register(emailHandler);

    const result = await runForm(createInput(schema), deps);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(INPUT_ENGINE_ERRORS.FORM_CANCELLED);
    }

    const pub = deps.eventBus.publish as ReturnType<typeof vi.fn>;
    const events = pub.mock.calls.map((c: unknown[]) => c[0]) as string[];
    expect(events).toContain('input-engine.form.cancelled');

    // Verify cancelled payload
    const cancelled = pub.mock.calls.find(
      (c: unknown[]) => c[0] === 'input-engine.form.cancelled',
    ) as unknown[];
    const payload = cancelled[1] as Record<string, unknown>;
    expect(payload).toMatchObject({
      userId: 'test-user',
      reason: 'user_cancel',
    });

    expect(deps.setActiveConversation).toHaveBeenLastCalledWith(undefined);
  });

  it('returns err(FIELD_MAX_RETRIES) after maxRetries exceeded', async () => {
    const nameSchema = registerField(z.string(), {
      fieldType: 'ShortText',
      i18nKey: 'form.name',
      maxRetries: 2,
    } as FieldMetadata);
    const schema = z.object({ name: nameSchema });

    const handler: FieldHandler = {
      fieldType: 'ShortText',
      render: vi.fn().mockResolvedValue(ok(undefined)),
      parseResponse: vi.fn().mockReturnValue(ok('bad-value')),
      validate: vi
        .fn()
        .mockReturnValue(err(new AppError(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED))),
    };

    const deps = createMockDeps();
    deps.registry.register(handler);

    const result = await runForm(createInput(schema), deps);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(INPUT_ENGINE_ERRORS.FIELD_MAX_RETRIES);
    }

    // 2 attempts: render->parse->validate(fail) x2
    expect(handler.render).toHaveBeenCalledTimes(2);
    expect(handler.parseResponse).toHaveBeenCalledTimes(2);
    expect(handler.validate).toHaveBeenCalledTimes(2);

    expect(deps.setActiveConversation).toHaveBeenLastCalledWith(undefined);
  });

  it('emits field.validated event for each field', async () => {
    const nameSchema = registerField(z.string(), {
      fieldType: 'ShortText',
      i18nKey: 'form.name',
    } as FieldMetadata);
    const schema = z.object({ name: nameSchema });

    const deps = createMockDeps();
    deps.registry.register(createMockHandler('ShortText', 'test'));

    await runForm(createInput(schema), deps);

    const pub = deps.eventBus.publish as ReturnType<typeof vi.fn>;
    const fvCall = pub.mock.calls.find(
      (c: unknown[]) => c[0] === 'input-engine.field.validated',
    ) as unknown[];

    expect(fvCall).toBeTruthy();
    const payload = fvCall[1] as Record<string, unknown>;
    expect(payload).toMatchObject({
      userId: 'test-user',
      fieldType: 'ShortText',
      fieldName: 'name',
      valid: true,
      retryCount: 0,
    });
  });

  it('uses provided formId from options', async () => {
    const nameSchema = registerField(z.string(), {
      fieldType: 'ShortText',
      i18nKey: 'form.name',
    } as FieldMetadata);
    const schema = z.object({ name: nameSchema });

    const deps = createMockDeps();
    deps.registry.register(createMockHandler('ShortText', 'test'));

    const input: FormRunnerInput = {
      ...createInput(schema),
      options: { formId: 'my-form-123' },
    };
    await runForm(input, deps);

    expect(deps.setActiveConversation).toHaveBeenCalledWith('my-form-123');

    const pub = deps.eventBus.publish as ReturnType<typeof vi.fn>;
    const started = pub.mock.calls.find(
      (c: unknown[]) => c[0] === 'input-engine.form.started',
    ) as unknown[];
    const sp = started[1] as Record<string, unknown>;
    expect(sp['formId']).toBe('my-form-123');
  });

  it('event emission failures are logged but do not fail the form', async () => {
    const nameSchema = registerField(z.string(), {
      fieldType: 'ShortText',
      i18nKey: 'form.name',
    } as FieldMetadata);
    const schema = z.object({ name: nameSchema });

    const deps = createMockDeps({
      eventBus: {
        publish: vi
          .fn()
          .mockResolvedValue(err(new AppError(INPUT_ENGINE_ERRORS.EVENT_PUBLISH_FAILED))),
      },
    });
    deps.registry.register(createMockHandler('ShortText', 'test'));

    const result = await runForm(createInput(schema), deps);

    expect(result.isOk()).toBe(true);
    expect(deps.logger.warn).toHaveBeenCalled();
  });

  describe('partial save', () => {
    function createMockAdapter() {
      return {
        read: vi.fn().mockResolvedValue(undefined),
        write: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined),
      };
    }

    it('saves field progress after each field when partialSave is enabled', async () => {
      const nameSchema = registerField(z.string(), {
        fieldType: 'ShortText',
        i18nKey: 'form.name',
      } as FieldMetadata);
      const emailSchema = registerField(z.string(), {
        fieldType: 'Email',
        i18nKey: 'form.email',
      } as FieldMetadata);
      const schema = z.object({ name: nameSchema, email: emailSchema });

      const mockAdapter = createMockAdapter();
      const deps = createMockDeps({
        storageAdapter: mockAdapter as unknown as ConversationsStorageAdapter,
      });
      deps.registry.register(createMockHandler('ShortText', 'John'));
      deps.registry.register(createMockHandler('Email', 'john@test.com'));

      const input: FormRunnerInput = {
        ...createInput(schema),
        options: { partialSave: true, formId: 'ps-form' },
      };
      await runForm(input, deps);

      // Should have written after each field (2 writes)
      expect(mockAdapter.write).toHaveBeenCalledTimes(2);

      // First write: after name field
      const firstCall = mockAdapter.write.mock.calls[0] as unknown[];
      expect(firstCall[0]).toBe('ie:form:12345:ps-form');
      expect(firstCall[1]).toMatchObject({
        formData: { name: 'John' },
        fieldsCompleted: 1,
        completedFieldNames: ['name'],
      });

      // Second write: after email field
      const secondCall = mockAdapter.write.mock.calls[1] as unknown[];
      expect(secondCall[1]).toMatchObject({
        formData: { name: 'John', email: 'john@test.com' },
        fieldsCompleted: 2,
        completedFieldNames: ['name', 'email'],
      });
    });

    it('restores partial save and skips completed fields on resume', async () => {
      const nameSchema = registerField(z.string(), {
        fieldType: 'ShortText',
        i18nKey: 'form.name',
      } as FieldMetadata);
      const emailSchema = registerField(z.string(), {
        fieldType: 'Email',
        i18nKey: 'form.email',
      } as FieldMetadata);
      const schema = z.object({ name: nameSchema, email: emailSchema });

      const mockAdapter = createMockAdapter();
      mockAdapter.read.mockResolvedValue({
        formData: { name: 'John' },
        fieldsCompleted: 1,
        completedFieldNames: ['name'],
      });

      const nameHandler = createMockHandler('ShortText', 'John');
      const emailHandler = createMockHandler('Email', 'john@test.com');

      const deps = createMockDeps({
        storageAdapter: mockAdapter as unknown as ConversationsStorageAdapter,
      });
      deps.registry.register(nameHandler);
      deps.registry.register(emailHandler);

      const input: FormRunnerInput = {
        ...createInput(schema),
        options: { partialSave: true, formId: 'ps-form' },
      };
      const result = await runForm<{ name: string; email: string }>(input, deps);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual({ name: 'John', email: 'john@test.com' });
      }

      // Name handler should NOT have been called (skipped)
      expect(nameHandler.render).not.toHaveBeenCalled();
      // Email handler SHOULD have been called
      expect(emailHandler.render).toHaveBeenCalled();
    });

    it('emits form.resumed when restoring from partial save', async () => {
      const nameSchema = registerField(z.string(), {
        fieldType: 'ShortText',
        i18nKey: 'form.name',
      } as FieldMetadata);
      const emailSchema = registerField(z.string(), {
        fieldType: 'Email',
        i18nKey: 'form.email',
      } as FieldMetadata);
      const schema = z.object({ name: nameSchema, email: emailSchema });

      const mockAdapter = createMockAdapter();
      mockAdapter.read.mockResolvedValue({
        formData: { name: 'John' },
        fieldsCompleted: 1,
        completedFieldNames: ['name'],
      });

      const deps = createMockDeps({
        storageAdapter: mockAdapter as unknown as ConversationsStorageAdapter,
      });
      deps.registry.register(createMockHandler('ShortText', 'John'));
      deps.registry.register(createMockHandler('Email', 'john@test.com'));

      const input: FormRunnerInput = {
        ...createInput(schema),
        options: { partialSave: true, formId: 'ps-form' },
      };
      await runForm(input, deps);

      const pub = deps.eventBus.publish as ReturnType<typeof vi.fn>;
      const events = pub.mock.calls.map((c: unknown[]) => c[0]) as string[];
      expect(events).toContain('input-engine.form.resumed');

      const resumed = pub.mock.calls.find(
        (c: unknown[]) => c[0] === 'input-engine.form.resumed',
      ) as unknown[];
      const payload = resumed[1] as Record<string, unknown>;
      expect(payload).toMatchObject({
        formId: 'ps-form',
        userId: 'test-user',
        resumedFromField: 1,
        totalFields: 2,
      });
    });

    it('deletes partial save on successful form completion', async () => {
      const nameSchema = registerField(z.string(), {
        fieldType: 'ShortText',
        i18nKey: 'form.name',
      } as FieldMetadata);
      const schema = z.object({ name: nameSchema });

      const mockAdapter = createMockAdapter();
      const deps = createMockDeps({
        storageAdapter: mockAdapter as unknown as ConversationsStorageAdapter,
      });
      deps.registry.register(createMockHandler('ShortText', 'John'));

      const input: FormRunnerInput = {
        ...createInput(schema),
        options: { partialSave: true, formId: 'ps-form' },
      };
      await runForm(input, deps);

      expect(mockAdapter.delete).toHaveBeenCalledWith('ie:form:12345:ps-form');
    });

    it('deletes partial save on user cancel', async () => {
      const nameSchema = registerField(z.string(), {
        fieldType: 'ShortText',
        i18nKey: 'form.name',
      } as FieldMetadata);
      const schema = z.object({ name: nameSchema });

      const handler: FieldHandler = {
        fieldType: 'ShortText',
        render: vi.fn().mockResolvedValue(err(new AppError(INPUT_ENGINE_ERRORS.FORM_CANCELLED))),
        parseResponse: vi.fn().mockReturnValue(ok('unused')),
        validate: vi.fn().mockReturnValue(ok('unused')),
      };

      const mockAdapter = createMockAdapter();
      const deps = createMockDeps({
        storageAdapter: mockAdapter as unknown as ConversationsStorageAdapter,
      });
      deps.registry.register(handler);

      const input: FormRunnerInput = {
        ...createInput(schema),
        options: { partialSave: true, formId: 'ps-form' },
      };
      await runForm(input, deps);

      expect(mockAdapter.delete).toHaveBeenCalledWith('ie:form:12345:ps-form');
    });

    it('preserves partial save on max_retries error', async () => {
      const nameSchema = registerField(z.string(), {
        fieldType: 'ShortText',
        i18nKey: 'form.name',
        maxRetries: 2,
      } as FieldMetadata);
      const schema = z.object({ name: nameSchema });

      const handler: FieldHandler = {
        fieldType: 'ShortText',
        render: vi.fn().mockResolvedValue(ok(undefined)),
        parseResponse: vi.fn().mockReturnValue(ok('bad-value')),
        validate: vi
          .fn()
          .mockReturnValue(err(new AppError(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED))),
      };

      const mockAdapter = createMockAdapter();
      const deps = createMockDeps({
        storageAdapter: mockAdapter as unknown as ConversationsStorageAdapter,
      });
      deps.registry.register(handler);

      const input: FormRunnerInput = {
        ...createInput(schema),
        options: { partialSave: true, formId: 'ps-form' },
      };
      const result = await runForm(input, deps);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(INPUT_ENGINE_ERRORS.FIELD_MAX_RETRIES);
      }

      // Should NOT have deleted partial save — preserves for resume
      expect(mockAdapter.delete).not.toHaveBeenCalled();
    });
  });

  describe('form timeout', () => {
    it('returns FORM_TIMEOUT when deadline exceeded', async () => {
      const nameSchema = registerField(z.string(), {
        fieldType: 'ShortText',
        i18nKey: 'form.name',
      } as FieldMetadata);
      const emailSchema = registerField(z.string(), {
        fieldType: 'Email',
        i18nKey: 'form.email',
      } as FieldMetadata);
      const schema = z.object({ name: nameSchema, email: emailSchema });

      // Call 1: startTime in progress, call 2: deadline check for 'name' (ok),
      // call 3+: deadline check for 'email' (exceeds 600_000)
      let callCount = 0;
      const now = vi.spyOn(Date, 'now').mockImplementation(() => {
        callCount++;
        if (callCount <= 2) return 1000;
        return 700_000;
      });

      const deps = createMockDeps();
      deps.registry.register(createMockHandler('ShortText', 'John'));
      deps.registry.register(createMockHandler('Email', 'john@test.com'));

      const input: FormRunnerInput = {
        ...createInput(schema),
        options: { formId: 'timeout-form' },
      };
      const result = await runForm(input, deps);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(INPUT_ENGINE_ERRORS.FORM_TIMEOUT);
      }

      now.mockRestore();
    });

    it('emits cancelled event with reason timeout on FORM_TIMEOUT', async () => {
      const nameSchema = registerField(z.string(), {
        fieldType: 'ShortText',
        i18nKey: 'form.name',
      } as FieldMetadata);
      const emailSchema = registerField(z.string(), {
        fieldType: 'Email',
        i18nKey: 'form.email',
      } as FieldMetadata);
      const schema = z.object({ name: nameSchema, email: emailSchema });

      let callCount = 0;
      const now = vi.spyOn(Date, 'now').mockImplementation(() => {
        callCount++;
        if (callCount <= 2) return 1000;
        return 700_000;
      });

      const deps = createMockDeps();
      deps.registry.register(createMockHandler('ShortText', 'John'));
      deps.registry.register(createMockHandler('Email', 'john@test.com'));

      const input: FormRunnerInput = {
        ...createInput(schema),
        options: { formId: 'timeout-form' },
      };
      await runForm(input, deps);

      const pub = deps.eventBus.publish as ReturnType<typeof vi.fn>;
      const cancelled = pub.mock.calls.find(
        (c: unknown[]) => c[0] === 'input-engine.form.cancelled',
      ) as unknown[];

      expect(cancelled).toBeTruthy();
      const payload = cancelled[1] as Record<string, unknown>;
      expect(payload).toMatchObject({
        formId: 'timeout-form',
        userId: 'test-user',
        reason: 'timeout',
      });

      now.mockRestore();
    });

    it('preserves partial save on timeout', async () => {
      const nameSchema = registerField(z.string(), {
        fieldType: 'ShortText',
        i18nKey: 'form.name',
      } as FieldMetadata);
      const emailSchema = registerField(z.string(), {
        fieldType: 'Email',
        i18nKey: 'form.email',
      } as FieldMetadata);
      const schema = z.object({ name: nameSchema, email: emailSchema });

      let callCount = 0;
      const now = vi.spyOn(Date, 'now').mockImplementation(() => {
        callCount++;
        if (callCount <= 2) return 1000;
        return 700_000;
      });

      const mockAdapter = {
        read: vi.fn().mockResolvedValue(undefined),
        write: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined),
      };

      const deps = createMockDeps({
        storageAdapter: mockAdapter as unknown as ConversationsStorageAdapter,
      });
      deps.registry.register(createMockHandler('ShortText', 'John'));
      deps.registry.register(createMockHandler('Email', 'john@test.com'));

      const input: FormRunnerInput = {
        ...createInput(schema),
        options: { partialSave: true, formId: 'timeout-form' },
      };
      const result = await runForm(input, deps);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(INPUT_ENGINE_ERRORS.FORM_TIMEOUT);
      }

      // Should NOT have deleted partial save — preserves for resume
      expect(mockAdapter.delete).not.toHaveBeenCalled();

      now.mockRestore();
    });
  });

  describe('render layer', () => {
    it('uses render return value as parseResponse context', async () => {
      const renderResponse = { message: { text: 'from-render' } };
      const nameSchema = registerField(z.string(), {
        fieldType: 'ShortText',
        i18nKey: 'form.name',
      } as FieldMetadata);
      const schema = z.object({ name: nameSchema });

      const handler: FieldHandler = {
        fieldType: 'ShortText',
        render: vi.fn().mockResolvedValue(ok(renderResponse)),
        parseResponse: vi.fn().mockReturnValue(ok('parsed-value')),
        validate: vi.fn().mockReturnValue(ok('validated-value')),
      };

      const deps = createMockDeps();
      deps.registry.register(handler);

      await runForm(createInput(schema), deps);

      // parseResponse should receive the render return value, not input.ctx
      expect(handler.parseResponse).toHaveBeenCalledWith(renderResponse, expect.anything());
    });

    it('falls back to input.ctx when render returns ok(undefined)', async () => {
      const nameSchema = registerField(z.string(), {
        fieldType: 'ShortText',
        i18nKey: 'form.name',
      } as FieldMetadata);
      const schema = z.object({ name: nameSchema });

      const handler: FieldHandler = {
        fieldType: 'ShortText',
        render: vi.fn().mockResolvedValue(ok(undefined)),
        parseResponse: vi.fn().mockReturnValue(ok('parsed-value')),
        validate: vi.fn().mockReturnValue(ok('validated-value')),
      };

      const deps = createMockDeps();
      deps.registry.register(handler);

      const input = createInput(schema);
      await runForm(input, deps);

      // parseResponse should receive input.ctx as fallback
      expect(handler.parseResponse).toHaveBeenCalledWith(input.ctx, expect.anything());
    });

    it('uses renderPrompt as fallback when render returns ok(undefined)', async () => {
      const mockResponseCtx = { message: { text: 'from-renderPrompt' } };
      const nameSchema = registerField(z.string(), {
        fieldType: 'ShortText',
        i18nKey: 'form.name',
      } as FieldMetadata);
      const schema = z.object({ name: nameSchema });

      const handler: FieldHandler = {
        fieldType: 'ShortText',
        render: vi.fn().mockResolvedValue(ok(undefined)),
        parseResponse: vi.fn().mockReturnValue(ok('parsed-value')),
        validate: vi.fn().mockReturnValue(ok('parsed-value')),
      };

      const renderPrompt = vi.fn().mockResolvedValue(ok(mockResponseCtx));
      const deps = createMockDeps({ renderPrompt });
      deps.registry.register(handler);

      const input: FormRunnerInput = {
        ...createInput(schema),
        options: { formId: 'rp-test' },
      };
      await runForm(input, deps);

      // renderPrompt should have been called
      expect(renderPrompt).toHaveBeenCalledTimes(1);
      // Should receive RenderContext with formId and fieldIndex, plus FieldMetadata
      const rpCall = renderPrompt.mock.calls[0] as unknown[];
      const rpRenderCtx = rpCall[0] as Record<string, unknown>;
      expect(rpRenderCtx['formId']).toBe('rp-test');
      expect(rpRenderCtx['fieldIndex']).toBe(0);
      const rpMeta = rpCall[1] as FieldMetadata;
      expect(rpMeta.fieldType).toBe('ShortText');
      // parseResponse should receive mockResponseCtx, NOT input.ctx
      expect(handler.parseResponse).toHaveBeenCalledWith(mockResponseCtx, expect.anything());
    });

    it('propagates renderPrompt error', async () => {
      const nameSchema = registerField(z.string(), {
        fieldType: 'ShortText',
        i18nKey: 'form.name',
      } as FieldMetadata);
      const schema = z.object({ name: nameSchema });

      const handler: FieldHandler = {
        fieldType: 'ShortText',
        render: vi.fn().mockResolvedValue(ok(undefined)),
        parseResponse: vi.fn().mockReturnValue(ok('parsed-value')),
        validate: vi.fn().mockReturnValue(ok('parsed-value')),
      };

      const renderPrompt = vi
        .fn()
        .mockResolvedValue(err(new AppError(INPUT_ENGINE_ERRORS.FIELD_RENDER_FAILED)));
      const deps = createMockDeps({ renderPrompt });
      deps.registry.register(handler);

      const result = await runForm(createInput(schema), deps);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(INPUT_ENGINE_ERRORS.FIELD_RENDER_FAILED);
      }
    });

    it('does not call renderPrompt when render returns a value', async () => {
      const someResponseCtx = { message: { text: 'from-render' } };
      const nameSchema = registerField(z.string(), {
        fieldType: 'ShortText',
        i18nKey: 'form.name',
      } as FieldMetadata);
      const schema = z.object({ name: nameSchema });

      const handler: FieldHandler = {
        fieldType: 'ShortText',
        render: vi.fn().mockResolvedValue(ok(someResponseCtx)),
        parseResponse: vi.fn().mockReturnValue(ok('parsed-value')),
        validate: vi.fn().mockReturnValue(ok('parsed-value')),
      };

      const renderPrompt = vi.fn();
      const deps = createMockDeps({ renderPrompt });
      deps.registry.register(handler);

      await runForm(createInput(schema), deps);

      expect(renderPrompt).not.toHaveBeenCalled();
      expect(handler.parseResponse).toHaveBeenCalledWith(someResponseCtx, expect.anything());
    });

    it('falls back to input.ctx when no renderPrompt provided and render returns undefined', async () => {
      const nameSchema = registerField(z.string(), {
        fieldType: 'ShortText',
        i18nKey: 'form.name',
      } as FieldMetadata);
      const schema = z.object({ name: nameSchema });

      const handler: FieldHandler = {
        fieldType: 'ShortText',
        render: vi.fn().mockResolvedValue(ok(undefined)),
        parseResponse: vi.fn().mockReturnValue(ok('parsed-value')),
        validate: vi.fn().mockReturnValue(ok('parsed-value')),
      };

      // Explicitly no renderPrompt in deps
      const deps = createMockDeps();
      deps.registry.register(handler);

      const input = createInput(schema);
      await runForm(input, deps);

      // Should fall back to input.ctx (backward compatible)
      expect(handler.parseResponse).toHaveBeenCalledWith(input.ctx, expect.anything());
    });

    it('passes formId and fieldIndex in RenderContext', async () => {
      let capturedRenderCtx: Record<string, unknown> | undefined;
      const nameSchema = registerField(z.string(), {
        fieldType: 'ShortText',
        i18nKey: 'form.name',
      } as FieldMetadata);
      const emailSchema = registerField(z.string(), {
        fieldType: 'Email',
        i18nKey: 'form.email',
      } as FieldMetadata);
      const schema = z.object({ name: nameSchema, email: emailSchema });

      const nameHandler: FieldHandler = {
        fieldType: 'ShortText',
        render: vi.fn().mockResolvedValue(ok(undefined)),
        parseResponse: vi.fn().mockReturnValue(ok('John')),
        validate: vi.fn().mockReturnValue(ok('John')),
      };

      const emailHandler: FieldHandler = {
        fieldType: 'Email',
        render: vi.fn().mockImplementation((renderCtx: Record<string, unknown>) => {
          capturedRenderCtx = renderCtx;
          return Promise.resolve(ok(undefined));
        }),
        parseResponse: vi.fn().mockReturnValue(ok('john@test.com')),
        validate: vi.fn().mockReturnValue(ok('john@test.com')),
      };

      const deps = createMockDeps();
      deps.registry.register(nameHandler);
      deps.registry.register(emailHandler);

      const input: FormRunnerInput = {
        ...createInput(schema),
        options: { formId: 'render-test-form' },
      };
      await runForm(input, deps);

      // Email is the second field (index 1)
      expect(capturedRenderCtx).toBeDefined();
      expect(capturedRenderCtx!['formId']).toBe('render-test-form');
      expect(capturedRenderCtx!['fieldIndex']).toBe(1);

      // Verify name handler got index 0
      const nameRenderCall = (nameHandler.render as ReturnType<typeof vi.fn>).mock
        .calls[0] as unknown[];
      const nameRenderCtx = nameRenderCall[0] as Record<string, unknown>;
      expect(nameRenderCtx['formId']).toBe('render-test-form');
      expect(nameRenderCtx['fieldIndex']).toBe(0);
    });
  });
});
