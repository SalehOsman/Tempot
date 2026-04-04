import { describe, it, expect, vi } from 'vitest';
import { ok, err } from 'neverthrow';
import { z } from 'zod';
import { AppError } from '@tempot/shared';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import { FIELD_SKIPPED_SENTINEL } from '../../src/input-engine.types.js';
import { FieldHandlerRegistry } from '../../src/fields/field.handler.js';
import type { FieldHandler } from '../../src/fields/field.handler.js';
import type { FieldMetadata, FieldType } from '../../src/input-engine.types.js';
import type {
  FormRunnerDeps,
  FormRunnerInput,
  FormProgress,
} from '../../src/runner/form.runner.js';
import { iterateFields } from '../../src/runner/field.iterator.js';

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

/** Create a fresh FormProgress for testing iterateFields directly */
function createProgress(formId = 'test-form'): FormProgress {
  return {
    fieldsCompleted: 0,
    totalFields: 0,
    formId,
    formData: {},
    completedFieldNames: [],
    partialSaveEnabled: false,
    storageKey: `ie:form:12345:${formId}`,
    startTime: Date.now(),
    maxMilliseconds: 600_000,
  };
}

describe('FieldIterator (iterateFields)', () => {
  describe('while loop forward iteration', () => {
    it('processes all fields forward in order', async () => {
      const nameSchema = registerField(z.string(), {
        fieldType: 'ShortText',
        i18nKey: 'form.name',
      } as FieldMetadata);
      const emailSchema = registerField(z.string(), {
        fieldType: 'Email',
        i18nKey: 'form.email',
      } as FieldMetadata);
      const schema = z.object({ name: nameSchema, email: emailSchema });

      const deps = createMockDeps();
      deps.registry.register(createMockHandler('ShortText', 'John'));
      deps.registry.register(createMockHandler('Email', 'john@test.com'));

      const progress = createProgress();
      const input = createInput(schema);
      const result = await iterateFields(input, deps, progress);

      expect(result.isOk()).toBe(true);
      expect(progress.formData).toEqual({
        name: 'John',
        email: 'john@test.com',
      });
      expect(progress.fieldsCompleted).toBe(2);
      expect(progress.completedFieldNames).toEqual(['name', 'email']);
    });

    it('skips conditional fields when condition is not met', async () => {
      const catSchema = registerField(z.string(), {
        fieldType: 'ShortText',
        i18nKey: 'form.category',
      } as FieldMetadata);
      const detailSchema = registerField(z.string(), {
        fieldType: 'LongText',
        i18nKey: 'form.detail',
        conditions: [{ dependsOn: 'category', operator: 'equals' as const, value: 'other' }],
      } as FieldMetadata);
      const schema = z.object({ category: catSchema, detail: detailSchema });

      const detailHandler = createMockHandler('LongText', 'some-detail');
      const deps = createMockDeps();
      deps.registry.register(createMockHandler('ShortText', 'not-other'));
      deps.registry.register(detailHandler);

      const progress = createProgress();
      const result = await iterateFields(createInput(schema), deps, progress);

      expect(result.isOk()).toBe(true);
      expect(progress.formData).toEqual({ category: 'not-other' });
      expect(detailHandler.render).not.toHaveBeenCalled();
    });

    it('skips already completed fields', async () => {
      const nameSchema = registerField(z.string(), {
        fieldType: 'ShortText',
        i18nKey: 'form.name',
      } as FieldMetadata);
      const emailSchema = registerField(z.string(), {
        fieldType: 'Email',
        i18nKey: 'form.email',
      } as FieldMetadata);
      const schema = z.object({ name: nameSchema, email: emailSchema });

      const nameHandler = createMockHandler('ShortText', 'John');
      const emailHandler = createMockHandler('Email', 'john@test.com');
      const deps = createMockDeps();
      deps.registry.register(nameHandler);
      deps.registry.register(emailHandler);

      const progress = createProgress();
      progress.formData = { name: 'John' };
      progress.completedFieldNames = ['name'];
      progress.fieldsCompleted = 1;

      const result = await iterateFields(createInput(schema), deps, progress);

      expect(result.isOk()).toBe(true);
      expect(nameHandler.render).not.toHaveBeenCalled();
      expect(emailHandler.render).toHaveBeenCalled();
    });
  });

  describe('back navigation', () => {
    it('decrements index when processField returns NAVIGATE_BACK', async () => {
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

      let emailCallCount = 0;
      const emailHandler: FieldHandler = {
        fieldType: 'Email',
        render: vi.fn().mockImplementation(() => {
          emailCallCount++;
          if (emailCallCount === 1) {
            return Promise.resolve(err(new AppError(INPUT_ENGINE_ERRORS.NAVIGATE_BACK)));
          }
          return Promise.resolve(ok(undefined));
        }),
        parseResponse: vi.fn().mockReturnValue(ok('john@test.com')),
        validate: vi.fn().mockReturnValue(ok('john@test.com')),
      };

      const deps = createMockDeps();
      deps.registry.register(nameHandler);
      deps.registry.register(emailHandler);

      const progress = createProgress();
      const result = await iterateFields(createInput(schema), deps, progress);

      expect(result.isOk()).toBe(true);
      // Name handler called twice: first time + after back navigation
      expect(nameHandler.render).toHaveBeenCalledTimes(2);
      // Email handler called twice: first (NAVIGATE_BACK) + second (success)
      expect(emailHandler.render).toHaveBeenCalledTimes(2);
      expect(progress.formData).toEqual({
        name: 'John',
        email: 'john@test.com',
      });
    });

    it('removes field from completedFieldNames and formData on back', async () => {
      const nameSchema = registerField(z.string(), {
        fieldType: 'ShortText',
        i18nKey: 'form.name',
      } as FieldMetadata);
      const emailSchema = registerField(z.string(), {
        fieldType: 'Email',
        i18nKey: 'form.email',
      } as FieldMetadata);
      const schema = z.object({ name: nameSchema, email: emailSchema });

      // Track progress state at the moment email returns NAVIGATE_BACK
      let capturedFormData: Record<string, unknown> | undefined;
      let capturedCompleted: string[] | undefined;

      const nameHandler: FieldHandler = {
        fieldType: 'ShortText',
        render: vi.fn().mockImplementation(() => {
          // On second call (after back nav), capture state
          if ((nameHandler.render as ReturnType<typeof vi.fn>).mock.calls.length > 1) {
            capturedFormData = { ...progress.formData };
            capturedCompleted = [...progress.completedFieldNames];
          }
          return Promise.resolve(ok(undefined));
        }),
        parseResponse: vi.fn().mockReturnValue(ok('John')),
        validate: vi.fn().mockReturnValue(ok('John')),
      };

      let emailCallCount = 0;
      const emailHandler: FieldHandler = {
        fieldType: 'Email',
        render: vi.fn().mockImplementation(() => {
          emailCallCount++;
          if (emailCallCount === 1) {
            return Promise.resolve(err(new AppError(INPUT_ENGINE_ERRORS.NAVIGATE_BACK)));
          }
          return Promise.resolve(ok(undefined));
        }),
        parseResponse: vi.fn().mockReturnValue(ok('john@test.com')),
        validate: vi.fn().mockReturnValue(ok('john@test.com')),
      };

      const deps = createMockDeps();
      deps.registry.register(nameHandler);
      deps.registry.register(emailHandler);

      const progress = createProgress();
      await iterateFields(createInput(schema), deps, progress);

      // When name handler runs the second time, 'name' should have been removed
      expect(capturedFormData).toBeDefined();
      expect(capturedFormData!['name']).toBeUndefined();
      expect(capturedCompleted).toBeDefined();
      expect(capturedCompleted).not.toContain('name');
    });

    it('ignores back on first field (index stays 0)', async () => {
      const nameSchema = registerField(z.string(), {
        fieldType: 'ShortText',
        i18nKey: 'form.name',
      } as FieldMetadata);
      const schema = z.object({ name: nameSchema });

      let callCount = 0;
      const nameHandler: FieldHandler = {
        fieldType: 'ShortText',
        render: vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return Promise.resolve(err(new AppError(INPUT_ENGINE_ERRORS.NAVIGATE_BACK)));
          }
          return Promise.resolve(ok(undefined));
        }),
        parseResponse: vi.fn().mockReturnValue(ok('John')),
        validate: vi.fn().mockReturnValue(ok('John')),
      };

      const deps = createMockDeps();
      deps.registry.register(nameHandler);

      const progress = createProgress();
      const result = await iterateFields(createInput(schema), deps, progress);

      expect(result.isOk()).toBe(true);
      // Should be called twice: first (NAVIGATE_BACK ignored) + second (success)
      expect(nameHandler.render).toHaveBeenCalledTimes(2);
      expect(progress.formData).toEqual({ name: 'John' });
    });

    it('back past conditional: re-evaluates and skips condition-false fields', async () => {
      // Fields: category -> detail (conditional on category='other') -> notes
      // Flow: category='other' -> detail='xxx' -> notes triggers BACK
      // Back should go to detail (still visible because category='other')
      const catSchema = registerField(z.string(), {
        fieldType: 'ShortText',
        i18nKey: 'form.category',
      } as FieldMetadata);
      const detailSchema = registerField(z.string(), {
        fieldType: 'LongText',
        i18nKey: 'form.detail',
        conditions: [{ dependsOn: 'category', operator: 'equals' as const, value: 'other' }],
      } as FieldMetadata);
      // Use 'Email' type for notes to avoid registry conflict with category's 'ShortText'
      const notesSchema = registerField(z.string(), {
        fieldType: 'Email',
        i18nKey: 'form.notes',
      } as FieldMetadata);
      const schema = z.object({
        category: catSchema,
        detail: detailSchema,
        notes: notesSchema,
      });

      const detailHandler: FieldHandler = {
        fieldType: 'LongText',
        render: vi.fn().mockResolvedValue(ok(undefined)),
        parseResponse: vi.fn().mockReturnValue(ok('detail-text')),
        validate: vi.fn().mockReturnValue(ok('detail-text')),
      };

      let notesCallCount = 0;
      const notesHandler: FieldHandler = {
        fieldType: 'Email',
        render: vi.fn().mockImplementation(() => {
          notesCallCount++;
          if (notesCallCount === 1) {
            return Promise.resolve(err(new AppError(INPUT_ENGINE_ERRORS.NAVIGATE_BACK)));
          }
          return Promise.resolve(ok(undefined));
        }),
        parseResponse: vi.fn().mockReturnValue(ok('note-value')),
        validate: vi.fn().mockReturnValue(ok('note-value')),
      };

      const catHandler: FieldHandler = {
        fieldType: 'ShortText',
        render: vi.fn().mockResolvedValue(ok(undefined)),
        parseResponse: vi.fn().mockReturnValue(ok('other')),
        validate: vi.fn().mockReturnValue(ok('other')),
      };

      const deps = createMockDeps();
      deps.registry.register(catHandler);
      deps.registry.register(detailHandler);
      deps.registry.register(notesHandler);

      const progress = createProgress();
      const result = await iterateFields(createInput(schema), deps, progress);

      expect(result.isOk()).toBe(true);
      // detail should be re-rendered after back (removed, then re-processed)
      expect(detailHandler.render).toHaveBeenCalledTimes(2);
      expect(progress.formData).toEqual({
        category: 'other',
        detail: 'detail-text',
        notes: 'note-value',
      });
    });

    it('formData updated correctly after back navigation and re-entry', async () => {
      const nameSchema = registerField(z.string(), {
        fieldType: 'ShortText',
        i18nKey: 'form.name',
      } as FieldMetadata);
      const emailSchema = registerField(z.string(), {
        fieldType: 'Email',
        i18nKey: 'form.email',
      } as FieldMetadata);
      const schema = z.object({ name: nameSchema, email: emailSchema });

      // Name returns 'John' first, 'Jane' after back
      let nameCallCount = 0;
      const nameHandler: FieldHandler = {
        fieldType: 'ShortText',
        render: vi.fn().mockResolvedValue(ok(undefined)),
        parseResponse: vi.fn().mockImplementation(() => {
          nameCallCount++;
          return ok(nameCallCount === 1 ? 'John' : 'Jane');
        }),
        validate: vi.fn().mockImplementation(() => {
          return ok(nameCallCount === 1 ? 'John' : 'Jane');
        }),
      };

      let emailCallCount = 0;
      const emailHandler: FieldHandler = {
        fieldType: 'Email',
        render: vi.fn().mockImplementation(() => {
          emailCallCount++;
          if (emailCallCount === 1) {
            return Promise.resolve(err(new AppError(INPUT_ENGINE_ERRORS.NAVIGATE_BACK)));
          }
          return Promise.resolve(ok(undefined));
        }),
        parseResponse: vi.fn().mockReturnValue(ok('jane@test.com')),
        validate: vi.fn().mockReturnValue(ok('jane@test.com')),
      };

      const deps = createMockDeps();
      deps.registry.register(nameHandler);
      deps.registry.register(emailHandler);

      const progress = createProgress();
      const result = await iterateFields(createInput(schema), deps, progress);

      expect(result.isOk()).toBe(true);
      // After back and re-entry, name should be 'Jane' (second value)
      expect(progress.formData).toEqual({
        name: 'Jane',
        email: 'jane@test.com',
      });
    });

    it('after partial save restore, back navigation works within restored fields', async () => {
      // EC38: 3-field form with partial save restore of fields A and B
      const fieldASchema = registerField(z.string(), {
        fieldType: 'ShortText',
        i18nKey: 'form.fieldA',
      } as FieldMetadata);
      const fieldBSchema = registerField(z.string(), {
        fieldType: 'Email',
        i18nKey: 'form.fieldB',
      } as FieldMetadata);
      const fieldCSchema = registerField(z.string(), {
        fieldType: 'LongText',
        i18nKey: 'form.fieldC',
      } as FieldMetadata);
      const schema = z.object({
        fieldA: fieldASchema,
        fieldB: fieldBSchema,
        fieldC: fieldCSchema,
      });

      const handlerA: FieldHandler = {
        fieldType: 'ShortText',
        render: vi.fn().mockResolvedValue(ok(undefined)),
        parseResponse: vi.fn().mockReturnValue(ok('newValB')),
        validate: vi.fn().mockReturnValue(ok('newValB')),
      };

      const handlerB: FieldHandler = {
        fieldType: 'Email',
        render: vi.fn().mockResolvedValue(ok(undefined)),
        parseResponse: vi.fn().mockReturnValue(ok('reValB')),
        validate: vi.fn().mockReturnValue(ok('reValB')),
      };

      let fieldCCallCount = 0;
      const handlerC: FieldHandler = {
        fieldType: 'LongText',
        render: vi.fn().mockImplementation(() => {
          fieldCCallCount++;
          if (fieldCCallCount === 1) {
            return Promise.resolve(err(new AppError(INPUT_ENGINE_ERRORS.NAVIGATE_BACK)));
          }
          return Promise.resolve(ok(undefined));
        }),
        parseResponse: vi.fn().mockReturnValue(ok('valC')),
        validate: vi.fn().mockReturnValue(ok('valC')),
      };

      const deps = createMockDeps();
      deps.registry.register(handlerA);
      deps.registry.register(handlerB);
      deps.registry.register(handlerC);

      // Simulate partial save restore: fields A and B already completed
      const progress = createProgress();
      progress.completedFieldNames = ['fieldA', 'fieldB'];
      progress.formData = { fieldA: 'valA', fieldB: 'valB' };
      progress.fieldsCompleted = 2;

      const result = await iterateFields(createInput(schema), deps, progress);

      expect(result.isOk()).toBe(true);
      // Field A should NOT have been rendered (was already completed and not the back target)
      expect(handlerA.render).not.toHaveBeenCalled();
      // Field B should be re-rendered once (after back nav removed it from completed)
      expect(handlerB.render).toHaveBeenCalledTimes(1);
      // Field C rendered twice: first (NAVIGATE_BACK) + second (success)
      expect(handlerC.render).toHaveBeenCalledTimes(2);
      // Final formData should have re-entered value for B and new value for C
      expect(progress.formData).toEqual({
        fieldA: 'valA',
        fieldB: 'reValB',
        fieldC: 'valC',
      });
      // All 3 fields should be completed
      expect(progress.completedFieldNames).toContain('fieldA');
      expect(progress.completedFieldNames).toContain('fieldB');
      expect(progress.completedFieldNames).toContain('fieldC');
      expect(progress.fieldsCompleted).toBe(3);
    });

    it('saves partial state after back navigation if enabled', async () => {
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

      let emailCallCount = 0;
      const emailHandler: FieldHandler = {
        fieldType: 'Email',
        render: vi.fn().mockImplementation(() => {
          emailCallCount++;
          if (emailCallCount === 1) {
            return Promise.resolve(err(new AppError(INPUT_ENGINE_ERRORS.NAVIGATE_BACK)));
          }
          return Promise.resolve(ok(undefined));
        }),
        parseResponse: vi.fn().mockReturnValue(ok('john@test.com')),
        validate: vi.fn().mockReturnValue(ok('john@test.com')),
      };

      const mockAdapter = {
        read: vi.fn().mockResolvedValue(undefined),
        write: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined),
      };

      const deps = createMockDeps({
        storageAdapter: mockAdapter as never,
      });
      deps.registry.register(nameHandler);
      deps.registry.register(emailHandler);

      const progress = createProgress();
      progress.partialSaveEnabled = true;

      const result = await iterateFields(createInput(schema), deps, progress);

      expect(result.isOk()).toBe(true);
      // Should have written: 1) after name, 2) after NAVIGATE_BACK, 3) after name again,
      // 4) after email. At minimum, write is called after back navigation.
      expect(mockAdapter.write.mock.calls.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('skip handling', () => {
    it('sets formData[fieldName] to undefined when processField returns FIELD_SKIPPED_SENTINEL', async () => {
      const nameSchema = registerField(z.string(), {
        fieldType: 'ShortText',
        i18nKey: 'form.name',
        optional: true,
      } as FieldMetadata);
      const schema = z.object({ name: nameSchema });

      // Handler returns FIELD_SKIPPED_SENTINEL from validate
      const handler: FieldHandler = {
        fieldType: 'ShortText',
        render: vi.fn().mockResolvedValue(ok(undefined)),
        parseResponse: vi.fn().mockReturnValue(ok(FIELD_SKIPPED_SENTINEL)),
        validate: vi.fn().mockReturnValue(ok(FIELD_SKIPPED_SENTINEL)),
      };

      const deps = createMockDeps();
      deps.registry.register(handler);

      const progress = createProgress();
      const result = await iterateFields(createInput(schema), deps, progress);

      expect(result.isOk()).toBe(true);
      expect(progress.formData['name']).toBeUndefined();
      expect('name' in progress.formData).toBe(true);
    });

    it('marks skipped field as completed in completedFieldNames', async () => {
      const nameSchema = registerField(z.string(), {
        fieldType: 'ShortText',
        i18nKey: 'form.name',
        optional: true,
      } as FieldMetadata);
      const emailSchema = registerField(z.string(), {
        fieldType: 'Email',
        i18nKey: 'form.email',
      } as FieldMetadata);
      const schema = z.object({ name: nameSchema, email: emailSchema });

      // Name handler returns sentinel (skip)
      const nameHandler: FieldHandler = {
        fieldType: 'ShortText',
        render: vi.fn().mockResolvedValue(ok(undefined)),
        parseResponse: vi.fn().mockReturnValue(ok(FIELD_SKIPPED_SENTINEL)),
        validate: vi.fn().mockReturnValue(ok(FIELD_SKIPPED_SENTINEL)),
      };
      const emailHandler = createMockHandler('Email', 'john@test.com');

      const deps = createMockDeps();
      deps.registry.register(nameHandler);
      deps.registry.register(emailHandler);

      const progress = createProgress();
      const result = await iterateFields(createInput(schema), deps, progress);

      expect(result.isOk()).toBe(true);
      expect(progress.completedFieldNames).toContain('name');
      expect(progress.completedFieldNames).toContain('email');
      expect(progress.fieldsCompleted).toBe(2);
    });

    it('emits input-engine.field.skipped with reason user_skip', async () => {
      const nameSchema = registerField(z.string(), {
        fieldType: 'ShortText',
        i18nKey: 'form.name',
        optional: true,
      } as FieldMetadata);
      const schema = z.object({ name: nameSchema });

      const handler: FieldHandler = {
        fieldType: 'ShortText',
        render: vi.fn().mockResolvedValue(ok(undefined)),
        parseResponse: vi.fn().mockReturnValue(ok(FIELD_SKIPPED_SENTINEL)),
        validate: vi.fn().mockReturnValue(ok(FIELD_SKIPPED_SENTINEL)),
      };

      const deps = createMockDeps();
      deps.registry.register(handler);

      const progress = createProgress();
      await iterateFields(createInput(schema), deps, progress);

      const publishCalls = (deps.eventBus.publish as ReturnType<typeof vi.fn>).mock.calls;
      const skipEvent = publishCalls.find(
        (call: unknown[]) => call[0] === 'input-engine.field.skipped',
      );
      expect(skipEvent).toBeDefined();
      expect(skipEvent![1]).toMatchObject({
        formId: progress.formId,
        userId: 'test-user',
        fieldName: 'name',
        fieldType: 'ShortText',
        reason: 'user_skip',
      });
    });

    it('returns err(FIELD_MAX_RETRIES) for non-optional field on maxRetries exhaustion', async () => {
      const nameSchema = registerField(z.string(), {
        fieldType: 'ShortText',
        i18nKey: 'form.name',
        maxRetries: 2,
      } as FieldMetadata);
      const schema = z.object({ name: nameSchema });

      // Handler always fails validation
      const handler: FieldHandler = {
        fieldType: 'ShortText',
        render: vi.fn().mockResolvedValue(ok(undefined)),
        parseResponse: vi.fn().mockReturnValue(ok('bad')),
        validate: vi
          .fn()
          .mockReturnValue(
            err(new AppError(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED, { reason: 'invalid' })),
          ),
      };

      const deps = createMockDeps();
      deps.registry.register(handler);

      const progress = createProgress();
      const result = await iterateFields(createInput(schema), deps, progress);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_MAX_RETRIES);
    });

    it('auto-skips optional field on maxRetries exhaustion with reason max_retries_skip', async () => {
      const nameSchema = registerField(z.string(), {
        fieldType: 'ShortText',
        i18nKey: 'form.name',
        optional: true,
        maxRetries: 2,
      } as FieldMetadata);
      const schema = z.object({ name: nameSchema });

      // Handler always fails validation
      const handler: FieldHandler = {
        fieldType: 'ShortText',
        render: vi.fn().mockResolvedValue(ok(undefined)),
        parseResponse: vi.fn().mockReturnValue(ok('bad')),
        validate: vi
          .fn()
          .mockReturnValue(
            err(new AppError(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED, { reason: 'invalid' })),
          ),
      };

      const deps = createMockDeps();
      deps.registry.register(handler);

      const progress = createProgress();
      const result = await iterateFields(createInput(schema), deps, progress);

      expect(result.isOk()).toBe(true);
      expect(progress.formData['name']).toBeUndefined();
      expect('name' in progress.formData).toBe(true);
      expect(progress.completedFieldNames).toContain('name');

      const publishCalls = (deps.eventBus.publish as ReturnType<typeof vi.fn>).mock.calls;
      const skipEvent = publishCalls.find(
        (call: unknown[]) => call[0] === 'input-engine.field.skipped',
      );
      expect(skipEvent).toBeDefined();
      expect(skipEvent![1]).toMatchObject({
        reason: 'max_retries_skip',
      });
    });
  });
});
