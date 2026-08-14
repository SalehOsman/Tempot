import type { AIConfig } from '../ai-core.types.js';
import type { AIAbilityChecker, AILogger, AIRegistry } from '../ai-core.contracts.js';
import type { ResilienceService } from '../resilience/resilience.service.js';
import type { CASLToolFilter } from '../tools/casl-tool.filter.js';
import type { ConfirmationEngine } from '../confirmation/confirmation.engine.js';
import type { RAGPipeline } from '../rag/rag-pipeline.service.js';
import type { AuditService } from '../audit/audit.service.js';

export interface GenerationOutput {
  text: string;
  totalUsage: { inputTokens?: number; outputTokens?: number; totalTokens?: number };
  toolCalls: Array<{ toolName: string }>;
}

export interface IntentResult {
  response: string;
  toolsCalled: string[];
  tokenUsage: { input: number; output: number; total: number };
  requiresConfirmation?: {
    confirmationId: string;
    level: string;
    summary: string;
    details?: string;
    code?: string;
  };
}

export interface IntentRouterDeps {
  registry: AIRegistry;
  modelId: string;
  resilience: ResilienceService;
  caslFilter: CASLToolFilter;
  confirmationEngine: ConfirmationEngine;
  ragPipeline: RAGPipeline;
  auditService: AuditService;
  logger: AILogger;
  config?: AIConfig;
}

export interface RouteOptions {
  message: string;
  userId: string;
  userRole: string;
  abilityChecker: AIAbilityChecker;
  systemPrompt: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
}
