import { describe, it, expect, vi } from 'vitest';
import { ok } from 'neverthrow';
import { z } from 'zod';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import { FieldHandlerRegistry } from '../../src/fields/field.handler.js';
import type { FieldHandler } from '../../src/fields/field.handler.js';
import type { FieldMetadata, FieldType } from '../../src/input-engine.types.js';
import type {
  FormRunnerDeps,
  FormRunnerInput,
  FormProgress,
} from '../../src/runner/form.runner.js';
import { CONFIRMATION_ACTIONS } from '../../src/runner/confirmation.renderer.js';
import {
  handleConfirmationLoop,
  type InlineKeyboardButton,
  type InlineKeyboardMarkup,
} from '../../src/runner/confirmation.handler.js';

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

/** Create a fresh FormProgress for testing */
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
    formOptions: {
      partialSave: false,
      partialSaveTTL: 86_400_000,
      maxMilliseconds: 600_000,
      allowCancel: true,
      formId,
      showProgress: true,
      showConfirmation: true,
    },
  };
}

/**
 * Create a mock conversation that returns callback data in sequence.
 * Each call to waitFor returns the next value in the sequence.
 */
function createMockConversation(callbackSequence: string[]): Record<string, unknown> {
  let callIndex = 0;
  return {
    external: vi.fn().mockImplementation(async (fn: () => Promise<unknown>) => fn()),
    waitFor: vi.fn().mockImplementation(() => {
      const data = callbackSequence[callIndex++];
      return Promise.resolve({
        callback_query: { data },
      });
    }),
  };
}

/** Create a mock ctx that tracks reply calls */
function createMockCtx(): Record<string, unknown> {
  return {
    reply: vi.fn().mockResolvedValue({ message_id: 1 }),
  };
}

describe('ConfirmationHandler (handleConfirmationLoop)', () => {
  describe('confirm action', () => {
    it('returns ok(undefined) when user confirms', async () => {
      const nameSchema = registerField(z.string(), {
        fieldType: 'ShortText',
        i18nKey: 'form.name',
      } as FieldMetadata);
      const schema = z.object({ name: nameSchema });

      const conversation = createMockConversation([CONFIRMATION_ACTIONS.CONFIRM]);
      const ctx = createMockCtx();

      const deps = createMockDeps();
      deps.registry.register(createMockHandler('ShortText'));

      const progress = createProgress();
      progress.formData = { name: 'John' };
      progress.completedFieldNames = ['name'];
      progress.fieldsCompleted = 1;
      progress.totalFields = 1;

      const input: FormRunnerInput = { conversation, ctx, schema };
      const result = await handleConfirmationLoop(input, deps, progress);

      expect(result.isOk()).toBe(true);
    });

    it('sends summary text via ctx.reply', async () => {
      const nameSchema = registerField(z.string(), {
        fieldType: 'ShortText',
        i18nKey: 'form.name',
      } as FieldMetadata);
      const schema = z.object({ name: nameSchema });

      const conversation = createMockConversation([CONFIRMATION_ACTIONS.CONFIRM]);
      const ctx = createMockCtx();

      const deps = createMockDeps();
      deps.registry.register(createMockHandler('ShortText'));

      const progress = createProgress();
      progress.formData = { name: 'John' };
      progress.completedFieldNames = ['name'];
      progress.fieldsCompleted = 1;
      progress.totalFields = 1;

      const input: FormRunnerInput = { conversation, ctx, schema };
      await handleConfirmationLoop(input, deps, progress);

      expect(ctx.reply).toHaveBeenCalled();
    });
  });

  describe('cancel action', () => {
    it('returns err(FORM_CANCELLED) with stage confirmation when user cancels', async () => {
      const nameSchema = registerField(z.string(), {
        fieldType: 'ShortText',
        i18nKey: 'form.name',
      } as FieldMetadata);
      const schema = z.object({ name: nameSchema });

      const conversation = createMockConversation([CONFIRMATION_ACTIONS.CANCEL]);
      const ctx = createMockCtx();

      const deps = createMockDeps();
      deps.registry.register(createMockHandler('ShortText'));

      const progress = createProgress();
      progress.formData = { name: 'John' };
      progress.completedFieldNames = ['name'];
      progress.fieldsCompleted = 1;
      progress.totalFields = 1;

      const input: FormRunnerInput = { conversation, ctx, schema };
      const result = await handleConfirmationLoop(input, deps, progress);

      expect(result.isErr()).toBe(true);
      const error = result._unsafeUnwrapErr();
      expect(error.code).toBe(INPUT_ENGINE_ERRORS.FORM_CANCELLED);
      expect(error.details).toMatchObject({ stage: 'confirmation' });
    });

    it('preserves partial save data when user cancels during confirmation', async () => {
      const nameSchema = registerField(z.string(), {
        fieldType: 'ShortText',
        i18nKey: 'form.name',
      } as FieldMetadata);
      const emailSchema = registerField(z.string(), {
        fieldType: 'Email',
        i18nKey: 'form.email',
      } as FieldMetadata);
      const schema = z.object({ name: nameSchema, email: emailSchema });

      const conversation = createMockConversation([CONFIRMATION_ACTIONS.CANCEL]);
      const ctx = createMockCtx();

      const deps = createMockDeps();
      deps.registry.register(createMockHandler('ShortText'));
      deps.registry.register(createMockHandler('Email'));

      const progress = createProgress();
      progress.partialSaveEnabled = true;
      progress.formData = { name: 'John', email: 'john@test.com' };
      progress.completedFieldNames = ['name', 'email'];
      progress.fieldsCompleted = 2;
      progress.totalFields = 2;

      const input: FormRunnerInput = { conversation, ctx, schema };
      const result = await handleConfirmationLoop(input, deps, progress);

      expect(result.isErr()).toBe(true);
      const error = result._unsafeUnwrapErr();
      expect(error.code).toBe(INPUT_ENGINE_ERRORS.FORM_CANCELLED);
      expect(error.details).toMatchObject({ stage: 'confirmation' });
      // Partial save data must be preserved — confirmation handler does NOT clear formData
      expect(progress.formData).toEqual({ name: 'John', email: 'john@test.com' });
      expect(progress.completedFieldNames).toEqual(['name', 'email']);
    });
  });

  describe('edit flow', () => {
    it('re-enters field value on edit and re-displays summary', async () => {
      const nameSchema = registerField(z.string(), {
        fieldType: 'ShortText',
        i18nKey: 'form.name',
      } as FieldMetadata);
      const emailSchema = registerField(z.string(), {
        fieldType: 'Email',
        i18nKey: 'form.email',
      } as FieldMetadata);
      const schema = z.object({ name: nameSchema, email: emailSchema });

      // Flow: EDIT → select "name" (field 0) → re-enter → CONFIRM
      const conversation = createMockConversation([
        CONFIRMATION_ACTIONS.EDIT,
        'ie:test-form:0:name', // select 'name' field
        CONFIRMATION_ACTIONS.CONFIRM,
      ]);
      const ctx = createMockCtx();

      const nameHandler = createMockHandler('ShortText', 'Jane');
      const emailHandler = createMockHandler('Email', 'john@test.com');
      const deps = createMockDeps();
      deps.registry.register(nameHandler);
      deps.registry.register(emailHandler);

      const progress = createProgress();
      progress.formData = { name: 'John', email: 'john@test.com' };
      progress.completedFieldNames = ['name', 'email'];
      progress.fieldsCompleted = 2;
      progress.totalFields = 2;

      const input: FormRunnerInput = { conversation, ctx, schema };
      const result = await handleConfirmationLoop(input, deps, progress);

      expect(result.isOk()).toBe(true);
      // Name should be re-entered with new value
      expect(progress.formData['name']).toBe('Jane');
    });

    it('re-evaluates conditions after edit and removes hidden fields', async () => {
      // Schema: category → detail (conditional: category === 'other') → notes
      // Edit category from 'other' → 'basic': detail should be removed
      const catSchema = registerField(z.string(), {
        fieldType: 'ShortText',
        i18nKey: 'form.category',
      } as FieldMetadata);
      const detailSchema = registerField(z.string(), {
        fieldType: 'LongText',
        i18nKey: 'form.detail',
        conditions: [{ dependsOn: 'category', operator: 'equals' as const, value: 'other' }],
      } as FieldMetadata);
      const notesSchema = registerField(z.string(), {
        fieldType: 'Email',
        i18nKey: 'form.notes',
      } as FieldMetadata);
      const schema = z.object({
        category: catSchema,
        detail: detailSchema,
        notes: notesSchema,
      });

      // Flow: EDIT → select "category" → new value 'basic' → CONFIRM
      const conversation = createMockConversation([
        CONFIRMATION_ACTIONS.EDIT,
        'ie:test-form:0:category',
        CONFIRMATION_ACTIONS.CONFIRM,
      ]);
      const ctx = createMockCtx();

      // Category handler returns 'basic' (making detail condition false)
      const catHandler = createMockHandler('ShortText', 'basic');
      const detailHandler = createMockHandler('LongText', 'some detail');
      const notesHandler = createMockHandler('Email', 'note');
      const deps = createMockDeps();
      deps.registry.register(catHandler);
      deps.registry.register(detailHandler);
      deps.registry.register(notesHandler);

      const progress = createProgress();
      progress.formData = { category: 'other', detail: 'old detail', notes: 'old note' };
      progress.completedFieldNames = ['category', 'detail', 'notes'];
      progress.fieldsCompleted = 3;
      progress.totalFields = 3;

      const input: FormRunnerInput = { conversation, ctx, schema };
      const result = await handleConfirmationLoop(input, deps, progress);

      expect(result.isOk()).toBe(true);
      // Category should be updated
      expect(progress.formData['category']).toBe('basic');
      // Detail should be removed from formData (condition now false)
      expect(progress.formData).not.toHaveProperty('detail');
    });

    it('D27: skips newly-visible fields before edit point in schema order', async () => {
      // Schema: A, B (cond: C=x), C
      // Initially: A='val', C='x' completed. B was skipped during initial fill
      //   because C wasn't in formData when B was evaluated.
      // Now formData has C='x', so B's condition is true.
      // Edit C (index 2). B at index 1 becomes visible but is BEFORE edit point.
      // D27: B should NOT be asked.
      const aSchema = registerField(z.string(), {
        fieldType: 'ShortText',
        i18nKey: 'form.a',
      } as FieldMetadata);
      const bSchema = registerField(z.string(), {
        fieldType: 'LongText',
        i18nKey: 'form.b',
        conditions: [{ dependsOn: 'c', operator: 'equals' as const, value: 'x' }],
      } as FieldMetadata);
      const cSchema = registerField(z.string(), {
        fieldType: 'Email',
        i18nKey: 'form.c',
      } as FieldMetadata);
      const schema = z.object({ a: aSchema, b: bSchema, c: cSchema });

      // Flow: EDIT → select C (index 2) → re-enter C → CONFIRM
      const conversation = createMockConversation([
        CONFIRMATION_ACTIONS.EDIT,
        'ie:test-form:2:c',
        CONFIRMATION_ACTIONS.CONFIRM,
      ]);
      const ctx = createMockCtx();

      const aHandler = createMockHandler('ShortText', 'val');
      const bHandler = createMockHandler('LongText', 'b-value');
      const cHandler = createMockHandler('Email', 'x');
      const deps = createMockDeps();
      deps.registry.register(aHandler);
      deps.registry.register(bHandler);
      deps.registry.register(cHandler);

      const progress = createProgress();
      // B was never completed (skipped during initial fill), but C='x' makes B visible now
      progress.formData = { a: 'val', c: 'x' };
      progress.completedFieldNames = ['a', 'c'];
      progress.fieldsCompleted = 2;
      progress.totalFields = 3;

      const input: FormRunnerInput = { conversation, ctx, schema };
      const result = await handleConfirmationLoop(input, deps, progress);

      expect(result.isOk()).toBe(true);
      // B should NOT have been asked — it's before the edit point (index 1 < 2)
      expect(progress.completedFieldNames).not.toContain('b');
      expect(bHandler.parseResponse).not.toHaveBeenCalled();
    });

    it('T3: newly-visible field after edit point is asked', async () => {
      // Schema: category, sub_category (cond: category=electronics), name
      // Completed: category=food, name=Pizza (sub_category skipped)
      // Edit category to 'electronics' → sub_category at index 1 becomes visible
      // Since edit point is index 0, sub_category at index 1 is AFTER edit point and SHOULD be asked
      const catSchema = registerField(z.string(), {
        fieldType: 'ShortText',
        i18nKey: 'form.category',
      } as FieldMetadata);
      const subCatSchema = registerField(z.string(), {
        fieldType: 'SingleChoice',
        i18nKey: 'form.sub_category',
        conditions: [{ dependsOn: 'category', operator: 'equals' as const, value: 'electronics' }],
      } as FieldMetadata);
      const nameSchema = registerField(z.string(), {
        fieldType: 'Email',
        i18nKey: 'form.name',
      } as FieldMetadata);
      const schema = z.object({
        category: catSchema,
        sub_category: subCatSchema,
        name: nameSchema,
      });

      // Flow: EDIT → select category → new value 'electronics' → (sub_category is asked) → CONFIRM
      const conversation = createMockConversation([
        CONFIRMATION_ACTIONS.EDIT,
        'ie:test-form:0:category',
        CONFIRMATION_ACTIONS.CONFIRM,
      ]);
      const ctx = createMockCtx();

      const catHandler = createMockHandler('ShortText', 'electronics');
      const subCatHandler = createMockHandler('SingleChoice', 'phones');
      const nameHandler = createMockHandler('Email', 'iPhone');
      const deps = createMockDeps();
      deps.registry.register(catHandler);
      deps.registry.register(subCatHandler);
      deps.registry.register(nameHandler);

      const progress = createProgress();
      progress.formData = { category: 'food', name: 'Pizza' };
      progress.completedFieldNames = ['category', 'name'];
      progress.fieldsCompleted = 2;
      progress.totalFields = 3;

      const input: FormRunnerInput = { conversation, ctx, schema };
      const result = await handleConfirmationLoop(input, deps, progress);

      expect(result.isOk()).toBe(true);
      // Category should be updated
      expect(progress.formData['category']).toBe('electronics');
      // sub_category should now be in formData (was asked since it's after edit point)
      expect(progress.formData['sub_category']).toBe('phones');
      expect(progress.completedFieldNames).toContain('sub_category');
    });
  });

  describe('timeout', () => {
    it('resets startTime when confirmation is displayed', async () => {
      const nameSchema = registerField(z.string(), {
        fieldType: 'ShortText',
        i18nKey: 'form.name',
      } as FieldMetadata);
      const schema = z.object({ name: nameSchema });

      const conversation = createMockConversation([CONFIRMATION_ACTIONS.CONFIRM]);
      const ctx = createMockCtx();

      const deps = createMockDeps();
      deps.registry.register(createMockHandler('ShortText'));

      const progress = createProgress();
      progress.formData = { name: 'John' };
      progress.completedFieldNames = ['name'];
      progress.fieldsCompleted = 1;
      progress.totalFields = 1;
      // Set startTime far in the past (would trigger timeout without reset)
      progress.startTime = Date.now() - 700_000;

      const input: FormRunnerInput = { conversation, ctx, schema };
      const startBefore = progress.startTime;
      const result = await handleConfirmationLoop(input, deps, progress);

      expect(result.isOk()).toBe(true);
      // startTime should have been reset to a recent value
      expect(progress.startTime).toBeGreaterThan(startBefore);
    });
  });
});

describe('Keyboard type safety (M8)', () => {
  it('InlineKeyboardButton has text and callback_data fields', () => {
    const button: InlineKeyboardButton = {
      text: 'Confirm',
      callback_data: 'confirm',
    };
    expect(button.text).toBe('Confirm');
    expect(button.callback_data).toBe('confirm');
  });

  it('InlineKeyboardMarkup has reply_markup with inline_keyboard', () => {
    const markup: InlineKeyboardMarkup = {
      reply_markup: {
        inline_keyboard: [[{ text: 'Confirm', callback_data: 'confirm' }]],
      },
    };
    expect(markup.reply_markup.inline_keyboard).toHaveLength(1);
    expect(markup.reply_markup.inline_keyboard[0]![0]!.text).toBe('Confirm');
  });
});
