import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { AILogger } from '../../src/ai-core.contracts.js';
import { AI_ERRORS } from '../../src/ai-core.errors.js';
import type { IntentResult } from '../../src/router/intent-router.js';
import type { ConfirmationEngine } from '../../src/confirmation/confirmation.engine.js';
import type { ConversationMemory } from '../../src/memory/conversation-memory.service.js';
import type { RateLimiterService } from '../../src/rate-limiter/rate-limiter.service.js';
import type { IntentRouter } from '../../src/router/intent-router.js';
import {
  TelegramAssistantUI,
  type TelegramAssistantDeps,
  type HandleMessageOptions,
  type EndSessionOptions,
} from '../../src/ui/telegram-assistant-ui.js';

// --- Mock factories ---

function createMockLogger(): AILogger {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };
}

function createMockIntentRouter(): Pick<IntentRouter, 'route'> {
  return {
    route: vi.fn(async () =>
      ok<IntentResult, AppError>({
        response: 'AI response',
        toolsCalled: [],
        tokenUsage: { input: 10, output: 5, total: 15 },
      }),
    ),
  };
}

function createMockRateLimiter(): Pick<RateLimiterService, 'consume'> {
  return {
    consume: vi.fn(async () => ok<void, AppError>(undefined)),
  };
}

function createMockConversationMemory(): Pick<ConversationMemory, 'summarizeAndStore'> {
  return {
    summarizeAndStore: vi.fn(async () => ok<void, AppError>(undefined)),
  };
}

function createMockConfirmationEngine(): Pick<
  ConfirmationEngine,
  'createConfirmation' | 'confirm' | 'cancel'
> {
  return {
    createConfirmation: vi.fn(),
    confirm: vi.fn(),
    cancel: vi.fn(),
  };
}

function createDefaultDeps(overrides: Partial<TelegramAssistantDeps> = {}): TelegramAssistantDeps {
  return {
    intentRouter: createMockIntentRouter() as TelegramAssistantDeps['intentRouter'],
    rateLimiter: createMockRateLimiter() as TelegramAssistantDeps['rateLimiter'],
    conversationMemory:
      createMockConversationMemory() as TelegramAssistantDeps['conversationMemory'],
    confirmationEngine:
      createMockConfirmationEngine() as TelegramAssistantDeps['confirmationEngine'],
    logger: createMockLogger(),
    ...overrides,
  };
}

function createDefaultHandleMessageOptions(
  overrides: Partial<HandleMessageOptions> = {},
): HandleMessageOptions {
  return {
    message: 'Hello AI',
    userId: 'user-1',
    userRole: 'user',
    abilityChecker: { can: vi.fn(() => true) },
    systemPrompt: 'You are a helpful assistant.',
    conversationHistory: [],
    ...overrides,
  };
}

function createDefaultEndSessionOptions(
  overrides: Partial<EndSessionOptions> = {},
): EndSessionOptions {
  return {
    userId: 'user-1',
    sessionId: 'session-abc',
    conversationHistory: [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' },
    ],
    ...overrides,
  };
}

describe('TelegramAssistantUI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('TelegramAssistantDeps interface', () => {
    it('exports TelegramAssistantDeps interface with all 4 required deps', () => {
      const deps = createDefaultDeps();

      // Verify all 4 required deps are present (+ logger)
      expect(deps.intentRouter).toBeDefined();
      expect(deps.rateLimiter).toBeDefined();
      expect(deps.conversationMemory).toBeDefined();
      expect(deps.confirmationEngine).toBeDefined();
      expect(deps.logger).toBeDefined();

      // Verify the class can be constructed with these deps
      const ui = new TelegramAssistantUI(deps);
      expect(ui).toBeInstanceOf(TelegramAssistantUI);
    });
  });

  describe('handleMessage orchestration', () => {
    it('orchestrates rate limit check then intent routing and returns result', async () => {
      const rateLimiter = createMockRateLimiter();
      const intentRouter = createMockIntentRouter();
      const deps = createDefaultDeps({
        rateLimiter: rateLimiter as TelegramAssistantDeps['rateLimiter'],
        intentRouter: intentRouter as TelegramAssistantDeps['intentRouter'],
      });
      const ui = new TelegramAssistantUI(deps);
      const options = createDefaultHandleMessageOptions();

      const result = await ui.handleMessage(options);

      // Rate limiter should be called first
      expect(rateLimiter.consume).toHaveBeenCalledOnce();
      expect(rateLimiter.consume).toHaveBeenCalledWith('user-1', 'user');

      // Intent router should be called after rate limit passes
      expect(intentRouter.route).toHaveBeenCalledOnce();
      expect(intentRouter.route).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Hello AI',
          userId: 'user-1',
          userRole: 'user',
          systemPrompt: 'You are a helpful assistant.',
          conversationHistory: [],
        }),
      );

      // Result should be the intent result
      expect(result.isOk()).toBe(true);
      const value = result._unsafeUnwrap();
      expect(value.response).toBe('AI response');
      expect(value.toolsCalled).toEqual([]);
      expect(value.tokenUsage).toEqual({ input: 10, output: 5, total: 15 });
    });

    it('rejects with rate limit error and prevents intent routing', async () => {
      const rateLimiter = {
        consume: vi.fn(async () =>
          err(
            new AppError(AI_ERRORS.RATE_LIMITED, {
              userId: 'user-1',
              role: 'user',
              limit: 20,
              windowMs: 60000,
            }),
          ),
        ),
      };
      const intentRouter = createMockIntentRouter();
      const deps = createDefaultDeps({
        rateLimiter: rateLimiter as never,
        intentRouter: intentRouter as TelegramAssistantDeps['intentRouter'],
      });
      const ui = new TelegramAssistantUI(deps);
      const options = createDefaultHandleMessageOptions();

      const result = await ui.handleMessage(options);

      // Should return rate limit error
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(AI_ERRORS.RATE_LIMITED);

      // Intent router should NOT have been called
      expect(intentRouter.route).not.toHaveBeenCalled();
    });

    it('passes abilityChecker through to intent router', async () => {
      const intentRouter = createMockIntentRouter();
      const abilityChecker = { can: vi.fn(() => true) };
      const deps = createDefaultDeps({
        intentRouter: intentRouter as TelegramAssistantDeps['intentRouter'],
      });
      const ui = new TelegramAssistantUI(deps);
      const options = createDefaultHandleMessageOptions({ abilityChecker });

      await ui.handleMessage(options);

      expect(intentRouter.route).toHaveBeenCalledWith(expect.objectContaining({ abilityChecker }));
    });
  });

  describe('endSession', () => {
    it('triggers conversation summarization via conversationMemory', async () => {
      const conversationMemory = createMockConversationMemory();
      const deps = createDefaultDeps({
        conversationMemory: conversationMemory as TelegramAssistantDeps['conversationMemory'],
      });
      const ui = new TelegramAssistantUI(deps);
      const options = createDefaultEndSessionOptions();

      const result = await ui.endSession(options);

      expect(result.isOk()).toBe(true);
      expect(conversationMemory.summarizeAndStore).toHaveBeenCalledOnce();
      expect(conversationMemory.summarizeAndStore).toHaveBeenCalledWith({
        userId: 'user-1',
        sessionId: 'session-abc',
        conversation: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' },
        ],
      });
    });

    it('returns error when summarization fails', async () => {
      const conversationMemory = {
        summarizeAndStore: vi.fn(async () => err(new AppError(AI_ERRORS.SUMMARIZATION_FAILED))),
      };
      const deps = createDefaultDeps({
        conversationMemory: conversationMemory as never,
      });
      const ui = new TelegramAssistantUI(deps);
      const options = createDefaultEndSessionOptions();

      const result = await ui.endSession(options);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(AI_ERRORS.SUMMARIZATION_FAILED);
    });
  });

  describe('dependency injection', () => {
    it('uses injected deps without coupling to concrete implementations', async () => {
      const rateLimiter = createMockRateLimiter();
      const intentRouter = createMockIntentRouter();
      const conversationMemory = createMockConversationMemory();
      const logger = createMockLogger();

      const deps = createDefaultDeps({
        rateLimiter: rateLimiter as TelegramAssistantDeps['rateLimiter'],
        intentRouter: intentRouter as TelegramAssistantDeps['intentRouter'],
        conversationMemory: conversationMemory as TelegramAssistantDeps['conversationMemory'],
        logger,
      });
      const ui = new TelegramAssistantUI(deps);

      // handleMessage uses rateLimiter + intentRouter
      await ui.handleMessage(createDefaultHandleMessageOptions());
      expect(rateLimiter.consume).toHaveBeenCalledOnce();
      expect(intentRouter.route).toHaveBeenCalledOnce();

      // endSession uses conversationMemory
      await ui.endSession(createDefaultEndSessionOptions());
      expect(conversationMemory.summarizeAndStore).toHaveBeenCalledOnce();
    });
  });
});
