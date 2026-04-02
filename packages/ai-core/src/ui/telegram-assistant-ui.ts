import { err } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import type { AppError } from '@tempot/shared';
import type { IntentRouter, IntentResult } from '../router/intent-router.js';
import type { RateLimiterService, RateLimitRole } from '../rate-limiter/rate-limiter.service.js';
import type { ConversationMemory } from '../memory/conversation-memory.service.js';
import type { ConfirmationEngine } from '../confirmation/confirmation.engine.js';
import type { AIAbilityChecker, AILogger } from '../ai-core.contracts.js';

export interface TelegramAssistantDeps {
  intentRouter: IntentRouter;
  rateLimiter: RateLimiterService;
  conversationMemory: ConversationMemory;
  confirmationEngine: ConfirmationEngine;
  logger: AILogger;
}

export interface HandleMessageOptions {
  message: string;
  userId: string;
  userRole: RateLimitRole;
  abilityChecker: AIAbilityChecker;
  systemPrompt: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface EndSessionOptions {
  userId: string;
  sessionId: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export class TelegramAssistantUI {
  constructor(private readonly deps: TelegramAssistantDeps) {}

  /** Handle an incoming user message in the AI conversation flow */
  async handleMessage(options: HandleMessageOptions): AsyncResult<IntentResult, AppError> {
    // 1. Rate limit check
    const rateLimitResult = await this.deps.rateLimiter.consume(options.userId, options.userRole);
    if (rateLimitResult.isErr()) {
      return err(rateLimitResult.error);
    }

    // 2. Route intent
    const intentResult = await this.deps.intentRouter.route({
      message: options.message,
      userId: options.userId,
      userRole: options.userRole,
      abilityChecker: options.abilityChecker,
      systemPrompt: options.systemPrompt,
      conversationHistory: options.conversationHistory,
    });

    return intentResult;
  }

  /** End the AI conversation session */
  async endSession(options: EndSessionOptions): AsyncResult<void, AppError> {
    return this.deps.conversationMemory.summarizeAndStore({
      userId: options.userId,
      sessionId: options.sessionId,
      conversation: options.conversationHistory,
    });
  }
}
