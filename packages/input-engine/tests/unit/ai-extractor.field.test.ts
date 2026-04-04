import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { AIExtractorFieldHandler } from '../../src/fields/smart/ai-extractor.field.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import type { FieldMetadata } from '../../src/input-engine.types.js';
import type { RenderContext } from '../../src/fields/field.handler.js';
import type { AIExtractionClient, InputEngineLogger } from '../../src/input-engine.contracts.js';

function createMeta(overrides: Partial<FieldMetadata> = {}): FieldMetadata {
  return {
    fieldType: 'AIExtractorField',
    i18nKey: 'test.aiExtractor',
    ...overrides,
  } as FieldMetadata;
}

function createMockAiClient(overrides: Partial<AIExtractionClient> = {}): AIExtractionClient {
  return {
    isAvailable: vi.fn().mockReturnValue(true),
    extract: vi.fn().mockResolvedValue(ok({ name: 'John', age: 30 })),
    ...overrides,
  };
}

function createMockLogger(): InputEngineLogger {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };
}

interface MockConversation {
  external: ReturnType<typeof vi.fn>;
  waitFor: ReturnType<typeof vi.fn>;
  waitForCallbackQuery: ReturnType<typeof vi.fn>;
}

interface MockCtx {
  reply: ReturnType<typeof vi.fn>;
}

function createMockConv(overrides: Partial<MockConversation> = {}): MockConversation {
  return {
    external: vi.fn().mockImplementation(async <T>(fn: () => Promise<T> | T) => fn()),
    waitFor: vi.fn().mockResolvedValue({ text: 'John Doe, age 30' }),
    waitForCallbackQuery: vi.fn().mockResolvedValue({
      data: 'ie:f1:0:__ai_accept__',
    }),
    ...overrides,
  };
}

function createMockCtx(): MockCtx {
  return { reply: vi.fn().mockResolvedValue(undefined) };
}

function createRenderCtx(overrides: Partial<RenderContext> = {}): RenderContext {
  return {
    conversation: createMockConv(),
    ctx: createMockCtx(),
    formData: {},
    formId: 'f1',
    fieldIndex: 0,
    t: (key: string) => key,
    ...overrides,
  };
}

describe('AIExtractorFieldHandler', () => {
  let handler: AIExtractorFieldHandler;

  beforeEach(() => {
    handler = new AIExtractorFieldHandler();
  });

  it('has correct fieldType', () => {
    expect(handler.fieldType).toBe('AIExtractorField');
  });

  describe('render', () => {
    it('returns ok(undefined) when no aiClient provided', async () => {
      const renderCtx = createRenderCtx({ aiClient: undefined });
      const result = await handler.render(renderCtx, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBeUndefined();
    });

    it('returns extracted values on full extraction success', async () => {
      const extracted = { name: 'John', age: 30 };
      const aiClient = createMockAiClient({
        extract: vi.fn().mockResolvedValue(ok(extracted)),
      });
      const mockConv = createMockConv({
        waitForCallbackQuery: vi.fn().mockResolvedValue({
          data: 'ie:f1:0:__ai_accept__',
        }),
      });
      const renderCtx = createRenderCtx({
        aiClient,
        conversation: mockConv,
      });

      const result = await handler.render(
        renderCtx,
        createMeta({
          targetFields: ['name', 'age'],
        }),
      );

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(extracted);
    });

    it('returns ok(undefined) on partial extraction with no extractable values', async () => {
      const aiClient = createMockAiClient({
        extract: vi.fn().mockResolvedValue(ok({})),
      });
      const renderCtx = createRenderCtx({ aiClient });

      const result = await handler.render(
        renderCtx,
        createMeta({
          targetFields: ['name', 'age'],
        }),
      );

      expect(result.isOk()).toBe(true);
      // Empty extraction → no summary lines → falls back to manual
      expect(result._unsafeUnwrap()).toBeUndefined();
    });

    it('falls back to manual when AI unavailable', async () => {
      const aiClient = createMockAiClient({
        isAvailable: vi.fn().mockReturnValue(false),
      });
      const mockCtx = createMockCtx();
      const renderCtx = createRenderCtx({ aiClient, ctx: mockCtx });

      const result = await handler.render(renderCtx, createMeta());

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBeUndefined();
      expect(mockCtx.reply).toHaveBeenCalledWith('input-engine.ai.unavailable');
    });

    it('returns extracted values when user accepts all', async () => {
      const extracted = { name: 'Jane', email: 'jane@test.com' };
      const aiClient = createMockAiClient({
        extract: vi.fn().mockResolvedValue(ok(extracted)),
      });
      const mockConv = createMockConv({
        waitForCallbackQuery: vi.fn().mockResolvedValue({
          data: 'ie:f1:0:__ai_accept__',
        }),
      });
      const renderCtx = createRenderCtx({
        aiClient,
        conversation: mockConv,
      });

      const result = await handler.render(
        renderCtx,
        createMeta({
          targetFields: ['name', 'email'],
        }),
      );

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(extracted);
    });

    it('returns partial extraction with __partial__ flag on edit', async () => {
      const extracted = { name: 'Jane', email: 'jane@test.com' };
      const aiClient = createMockAiClient({
        extract: vi.fn().mockResolvedValue(ok(extracted)),
      });
      const mockConv = createMockConv({
        waitForCallbackQuery: vi.fn().mockResolvedValue({
          data: 'ie:f1:0:__ai_edit__',
        }),
      });
      const renderCtx = createRenderCtx({
        aiClient,
        conversation: mockConv,
      });

      const result = await handler.render(
        renderCtx,
        createMeta({
          targetFields: ['name', 'email'],
        }),
      );

      expect(result.isOk()).toBe(true);
      const value = result._unsafeUnwrap() as Record<string, unknown>;
      expect(value).toEqual({ ...extracted, __partial__: true });
    });

    it('returns ok(undefined) when user chooses manual input', async () => {
      const extracted = { name: 'Jane' };
      const aiClient = createMockAiClient({
        extract: vi.fn().mockResolvedValue(ok(extracted)),
      });
      const mockConv = createMockConv({
        waitForCallbackQuery: vi.fn().mockResolvedValue({
          data: 'ie:f1:0:__ai_manual__',
        }),
      });
      const renderCtx = createRenderCtx({
        aiClient,
        conversation: mockConv,
      });

      const result = await handler.render(
        renderCtx,
        createMeta({
          targetFields: ['name'],
        }),
      );

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBeUndefined();
    });

    it('falls back to manual on extraction failure and logs warning', async () => {
      const aiClient = createMockAiClient({
        extract: vi
          .fn()
          .mockResolvedValue(
            err(new AppError(INPUT_ENGINE_ERRORS.AI_EXTRACTION_FAILED, { reason: 'AI error' })),
          ),
      });
      const logger = createMockLogger();
      const renderCtx = createRenderCtx({ aiClient, logger });

      const result = await handler.render(
        renderCtx,
        createMeta({
          targetFields: ['name'],
        }),
      );

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBeUndefined();
      expect(logger.warn).toHaveBeenCalled();
    });

    it('falls back to manual when conversation.external throws during extraction', async () => {
      const aiClient = createMockAiClient();
      const logger = createMockLogger();
      let callCount = 0;
      const mockConv = createMockConv({
        external: vi.fn().mockImplementation(async <T>(fn: () => Promise<T> | T) => {
          callCount++;
          // First call is isAvailable — pass through; second call is extract — throw
          if (callCount > 1) throw new Error('BoundaryError: replay failed');
          return fn();
        }),
      });
      const renderCtx = createRenderCtx({ aiClient, conversation: mockConv, logger });

      const result = await handler.render(
        renderCtx,
        createMeta({
          targetFields: ['name'],
        }),
      );

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBeUndefined();
      expect(logger.warn).toHaveBeenCalled();
    });

    it('returns ok(undefined) when user input has no text or caption', async () => {
      const aiClient = createMockAiClient();
      const mockConv = createMockConv({
        waitFor: vi.fn().mockResolvedValue({ photo: { file_id: '123' } }),
      });
      const renderCtx = createRenderCtx({ aiClient, conversation: mockConv });

      const result = await handler.render(
        renderCtx,
        createMeta({
          targetFields: ['name'],
        }),
      );

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBeUndefined();
    });

    it('uses caption from photo as input text (D23)', async () => {
      const extracted = { name: 'FromCaption' };
      const aiClient = createMockAiClient({
        extract: vi.fn().mockResolvedValue(ok(extracted)),
      });
      const mockConv = createMockConv({
        waitFor: vi.fn().mockResolvedValue({ caption: 'John Doe, age 30' }),
        waitForCallbackQuery: vi.fn().mockResolvedValue({
          data: 'ie:f1:0:__ai_accept__',
        }),
      });
      const renderCtx = createRenderCtx({
        aiClient,
        conversation: mockConv,
      });

      const result = await handler.render(
        renderCtx,
        createMeta({
          targetFields: ['name'],
        }),
      );

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(extracted);
      // Verify extract was called with the caption text
      expect(aiClient.extract).toHaveBeenCalledWith('John Doe, age 30', ['name']);
    });

    it('renders confirmation UI with 3 action buttons', async () => {
      const extracted = { name: 'John', age: 30 };
      const aiClient = createMockAiClient({
        extract: vi.fn().mockResolvedValue(ok(extracted)),
      });
      const mockCtx = createMockCtx();
      const mockConv = createMockConv({
        waitForCallbackQuery: vi.fn().mockResolvedValue({
          data: 'ie:f1:0:__ai_accept__',
        }),
      });
      const renderCtx = createRenderCtx({
        aiClient,
        conversation: mockConv,
        ctx: mockCtx,
      });

      await handler.render(renderCtx, createMeta({ targetFields: ['name', 'age'] }));

      // Find the confirmation reply (second call — first is the prompt)
      const confirmCall = mockCtx.reply.mock.calls.find(
        (call: unknown[]) => typeof call[1] === 'object' && call[1] !== null,
      );
      expect(confirmCall).toBeDefined();
      const replyMarkup = (confirmCall![1] as Record<string, unknown>).reply_markup as {
        inline_keyboard: Array<Array<{ text: string; callback_data: string }>>;
      };
      expect(replyMarkup.inline_keyboard).toHaveLength(2);
      // Row 1: Accept + Edit
      expect(replyMarkup.inline_keyboard[0]).toHaveLength(2);
      expect(replyMarkup.inline_keyboard[0][0].callback_data).toContain('__ai_accept__');
      expect(replyMarkup.inline_keyboard[0][1].callback_data).toContain('__ai_edit__');
      // Row 2: Manual
      expect(replyMarkup.inline_keyboard[1]).toHaveLength(1);
      expect(replyMarkup.inline_keyboard[1][0].callback_data).toContain('__ai_manual__');
    });
  });

  describe('parseResponse', () => {
    it('extracts text from message', () => {
      const result = handler.parseResponse({ text: 'hello world' }, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('hello world');
    });

    it('trims text from message', () => {
      const result = handler.parseResponse({ text: '  hello  ' }, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('hello');
    });

    it('extracts caption from photo/document message (D23)', () => {
      const result = handler.parseResponse({ caption: 'photo caption text' }, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('photo caption text');
    });

    it('prefers text over caption when both present', () => {
      const result = handler.parseResponse(
        { text: 'the text', caption: 'the caption' },
        createMeta(),
      );
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('the text');
    });

    it('returns err when no text or caption in message', () => {
      const result = handler.parseResponse({}, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED);
    });
  });

  describe('validate', () => {
    it('accepts string value', () => {
      const result = handler.validate('raw text input', undefined, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('raw text input');
    });

    it('accepts object value (extracted data)', () => {
      const extracted = { name: 'John', age: 30 };
      const result = handler.validate(extracted, undefined, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual({ name: 'John', age: 30 });
    });

    it('returns err for empty string', () => {
      const result = handler.validate('', undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });

    it('returns err for null value', () => {
      const result = handler.validate(null, undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });

    it('returns err for undefined value', () => {
      const result = handler.validate(undefined, undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });
  });
});
