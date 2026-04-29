import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ok, err } from 'neverthrow';
import { z } from 'zod';
import { AppError } from '@tempot/shared';
import type { AITool } from '../../src/ai-core.types.js';
import type { AIAbilityChecker, AILogger } from '../../src/ai-core.contracts.js';
import { AI_ERRORS } from '../../src/ai-core.errors.js';
import type { RAGContext } from '../../src/rag/rag-pipeline.service.js';
import {
  IntentRouter,
  type IntentRouterDeps,
  type RouteOptions,
} from '../../src/router/intent.router.js';

// --- Module mock: `ai` ---
const mockGenerateText = vi.fn();
vi.mock('ai', () => ({
  generateText: (...args: unknown[]) => mockGenerateText(...args),
  stepCountIs: vi.fn((count: number) => ({ type: 'stepCount', count })),
}));

// --- Mock factories ---

function createMockTool(overrides: Partial<AITool> = {}): AITool {
  return {
    name: 'test-tool',
    description: 'A test tool',
    parameters: z.object({ input: z.string() }),
    requiredPermission: { action: 'read', subject: 'test' },
    confirmationLevel: 'none',
    version: '1.0.0',
    execute: vi.fn(async () => ok('tool-result')),
    ...overrides,
  };
}

function createMockResilience() {
  return {
    executeGeneration: vi.fn(async (fn: () => Promise<unknown>) => {
      const result = await fn();
      return ok(result);
    }),
  };
}

function createMockCASLFilter(tools: AITool[] = []) {
  return { filterForUser: vi.fn(() => tools) };
}

function createMockRAGPipeline(context?: RAGContext) {
  return {
    retrieve: vi.fn(async () => ok(context ?? { hasResults: false, context: '', sources: [] })),
  };
}

function createMockAuditService() {
  return { log: vi.fn(async () => ok(undefined)) };
}

function createMockConfirmationEngine() {
  return {
    createConfirmation: vi.fn(),
    confirm: vi.fn(),
    cancel: vi.fn(),
  };
}

function createMockLogger(): AILogger {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };
}

function createMockAbility(allowed = true): AIAbilityChecker {
  return { can: vi.fn(() => allowed) };
}

function createMockRegistry() {
  return {
    languageModel: vi.fn(() => 'mock-model-instance'),
    textEmbeddingModel: vi.fn(() => 'mock-embedding-model'),
  };
}

function createDefaultDeps(overrides: Partial<IntentRouterDeps> = {}): IntentRouterDeps {
  return {
    registry: createMockRegistry(),
    modelId: 'test-model',
    resilience: createMockResilience() as never,
    caslFilter: createMockCASLFilter() as never,
    confirmationEngine: createMockConfirmationEngine() as never,
    ragPipeline: createMockRAGPipeline() as never,
    auditService: createMockAuditService() as never,
    logger: createMockLogger(),
    ...overrides,
  };
}

function createDefaultRouteOptions(overrides: Partial<RouteOptions> = {}): RouteOptions {
  return {
    message: 'Hello AI',
    userId: 'user-1',
    userRole: 'user',
    abilityChecker: createMockAbility(),
    systemPrompt: 'You are a helpful assistant.',
    conversationHistory: [],
    ...overrides,
  };
}

/** Standard mock return for generateText (AI SDK v6 format) */
function defaultGenerateTextResult() {
  return {
    text: 'AI response',
    totalUsage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
    toolCalls: [],
  };
}

describe('IntentRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateText.mockResolvedValue(defaultGenerateTextResult());
  });

  describe('successful routing with tools', () => {
    it('passes filtered tools to generateText as SDK tools', async () => {
      const tool = createMockTool({ name: 'search-articles' });
      const caslFilter = createMockCASLFilter([tool]);
      const deps = createDefaultDeps({ caslFilter: caslFilter as never });
      const router = new IntentRouter(deps);
      const options = createDefaultRouteOptions();

      const result = await router.route(options);

      expect(result.isOk()).toBe(true);

      // Verify generateText was called
      expect(mockGenerateText).toHaveBeenCalledOnce();
      const callArgs = mockGenerateText.mock.calls[0][0] as {
        tools: Record<string, unknown>;
      };

      // Should have the converted tool
      expect(callArgs.tools).toHaveProperty('search-articles');
    });
  });

  describe('routing with RAG context', () => {
    it('includes RAG context in system prompt when available', async () => {
      const ragContext: RAGContext = {
        hasResults: true,
        context: 'Relevant knowledge base content here.',
        sources: [],
      };
      const ragPipeline = createMockRAGPipeline(ragContext);
      const deps = createDefaultDeps({ ragPipeline: ragPipeline as never });
      const router = new IntentRouter(deps);
      const options = createDefaultRouteOptions({
        systemPrompt: 'You are an assistant.',
      });

      await router.route(options);

      expect(mockGenerateText).toHaveBeenCalledOnce();
      const callArgs = mockGenerateText.mock.calls[0][0] as {
        messages: Array<{ role: string; content: string }>;
      };

      // System message should contain RAG context
      const systemMessage = callArgs.messages.find((m) => m.role === 'system');
      expect(systemMessage).toBeDefined();
      expect(systemMessage!.content).toContain('You are an assistant.');
      expect(systemMessage!.content).toContain('Relevant knowledge base content here.');
    });
  });

  describe('no tools available', () => {
    it('calls generateText without tools when no tools are permitted', async () => {
      const caslFilter = createMockCASLFilter([]); // No tools
      const deps = createDefaultDeps({ caslFilter: caslFilter as never });
      const router = new IntentRouter(deps);
      const options = createDefaultRouteOptions();

      const result = await router.route(options);

      expect(result.isOk()).toBe(true);
      expect(mockGenerateText).toHaveBeenCalledOnce();
      const callArgs = mockGenerateText.mock.calls[0][0] as {
        tools: Record<string, unknown>;
      };
      expect(Object.keys(callArgs.tools)).toHaveLength(0);
    });
  });

  describe('resilience failure', () => {
    it('returns err when resilience service returns failure', async () => {
      const resilience = {
        executeGeneration: vi.fn(async () => err(new AppError(AI_ERRORS.CIRCUIT_OPEN))),
      };
      const deps = createDefaultDeps({ resilience: resilience as never });
      const router = new IntentRouter(deps);
      const options = createDefaultRouteOptions();

      const result = await router.route(options);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(AI_ERRORS.CIRCUIT_OPEN);
    });
  });

  describe('audit logging', () => {
    it('calls audit service with fire-and-log pattern after successful generation', async () => {
      const auditService = createMockAuditService();
      const deps = createDefaultDeps({ auditService: auditService as never });
      const router = new IntentRouter(deps);
      const options = createDefaultRouteOptions({ message: 'Hello' });

      await router.route(options);

      // Audit log should be called (fire-and-log pattern — void prefix)
      expect(auditService.log).toHaveBeenCalledOnce();
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          action: 'generation',
          input: 'Hello',
          output: 'AI response',
          tokenUsage: { input: 10, output: 5, total: 15 },
          success: true,
        }),
      );
    });
  });

  describe('tool execution in result', () => {
    it('includes tool names in toolsCalled from generation result', async () => {
      const tool = createMockTool({ name: 'get-user-info' });
      const caslFilter = createMockCASLFilter([tool]);
      const deps = createDefaultDeps({ caslFilter: caslFilter as never });
      const router = new IntentRouter(deps);
      const options = createDefaultRouteOptions();

      mockGenerateText.mockResolvedValue({
        text: 'Here is the user info.',
        totalUsage: { inputTokens: 20, outputTokens: 10, totalTokens: 30 },
        toolCalls: [{ toolName: 'get-user-info' }],
      });

      const result = await router.route(options);

      expect(result.isOk()).toBe(true);
      const value = result._unsafeUnwrap();
      expect(value.toolsCalled).toContain('get-user-info');
      expect(value.response).toBe('Here is the user info.');
      expect(value.tokenUsage).toEqual({ input: 20, output: 10, total: 30 });
    });
  });

  describe('empty conversation history', () => {
    it('handles empty conversation history correctly', async () => {
      const deps = createDefaultDeps();
      const router = new IntentRouter(deps);
      const options = createDefaultRouteOptions({
        conversationHistory: [],
        message: 'First message',
        systemPrompt: 'System prompt here.',
      });

      await router.route(options);

      expect(mockGenerateText).toHaveBeenCalledOnce();
      const callArgs = mockGenerateText.mock.calls[0][0] as {
        messages: Array<{ role: string; content: string }>;
      };

      // Should have system message + user message only (no history)
      expect(callArgs.messages).toHaveLength(2);
      expect(callArgs.messages[0]).toEqual({
        role: 'system',
        content: 'System prompt here.',
      });
      expect(callArgs.messages[1]).toEqual({
        role: 'user',
        content: 'First message',
      });
    });
  });

  describe('multiple tools called in multi-step loop', () => {
    it('reports all tool names when multiple tools are called', async () => {
      const toolA = createMockTool({ name: 'tool-alpha' });
      const toolB = createMockTool({ name: 'tool-beta' });
      const caslFilter = createMockCASLFilter([toolA, toolB]);
      const deps = createDefaultDeps({ caslFilter: caslFilter as never });
      const router = new IntentRouter(deps);
      const options = createDefaultRouteOptions();

      mockGenerateText.mockResolvedValue({
        text: 'Done with both tools.',
        totalUsage: { inputTokens: 30, outputTokens: 15, totalTokens: 45 },
        toolCalls: [{ toolName: 'tool-alpha' }, { toolName: 'tool-beta' }],
      });

      const result = await router.route(options);

      expect(result.isOk()).toBe(true);
      const value = result._unsafeUnwrap();
      expect(value.toolsCalled).toEqual(['tool-alpha', 'tool-beta']);
      expect(value.tokenUsage).toEqual({ input: 30, output: 15, total: 45 });
    });
  });

  describe('conversation history preserved', () => {
    it('includes conversation history in messages sent to model', async () => {
      const deps = createDefaultDeps();
      const router = new IntentRouter(deps);
      const history: Array<{ role: 'user' | 'assistant'; content: string }> = [
        { role: 'user', content: 'Previous question' },
        { role: 'assistant', content: 'Previous answer' },
      ];
      const options = createDefaultRouteOptions({
        conversationHistory: history,
        message: 'Follow-up question',
        systemPrompt: 'System context.',
      });

      await router.route(options);

      expect(mockGenerateText).toHaveBeenCalledOnce();
      const callArgs = mockGenerateText.mock.calls[0][0] as {
        messages: Array<{ role: string; content: string }>;
      };

      // system + 2 history + current message = 4
      expect(callArgs.messages).toHaveLength(4);
      expect(callArgs.messages[0]).toEqual({ role: 'system', content: 'System context.' });
      expect(callArgs.messages[1]).toEqual({ role: 'user', content: 'Previous question' });
      expect(callArgs.messages[2]).toEqual({ role: 'assistant', content: 'Previous answer' });
      expect(callArgs.messages[3]).toEqual({ role: 'user', content: 'Follow-up question' });
    });
  });

  describe('stopWhen configuration', () => {
    it('passes stopWhen to generateText for agent loop', async () => {
      const deps = createDefaultDeps();
      const router = new IntentRouter(deps);
      const options = createDefaultRouteOptions();

      await router.route(options);

      expect(mockGenerateText).toHaveBeenCalledOnce();
      const callArgs = mockGenerateText.mock.calls[0][0] as {
        stopWhen: { type: string; count: number };
      };
      // stepCountIs(5) is mocked to return { type: 'stepCount', count: 5 }
      expect(callArgs.stopWhen).toEqual({ type: 'stepCount', count: 5 });
    });
  });

  describe('RAG pipeline failure gracefully handled', () => {
    it('continues with empty RAG context when RAG pipeline fails', async () => {
      const ragPipeline = {
        retrieve: vi.fn(async () => err(new AppError(AI_ERRORS.RAG_SEARCH_FAILED))),
      };
      const deps = createDefaultDeps({ ragPipeline: ragPipeline as never });
      const router = new IntentRouter(deps);
      const options = createDefaultRouteOptions({
        systemPrompt: 'Base system prompt.',
      });

      const result = await router.route(options);

      // Should succeed despite RAG failure
      expect(result.isOk()).toBe(true);

      // System message should NOT have RAG context appended
      const callArgs = mockGenerateText.mock.calls[0][0] as {
        messages: Array<{ role: string; content: string }>;
      };
      const systemMessage = callArgs.messages.find((m) => m.role === 'system');
      expect(systemMessage!.content).toBe('Base system prompt.');
    });
  });

  describe('token usage defaults', () => {
    it('defaults token usage to zeros when totalUsage is undefined', async () => {
      const deps = createDefaultDeps();
      const router = new IntentRouter(deps);
      const options = createDefaultRouteOptions();

      mockGenerateText.mockResolvedValue({
        text: 'Response without usage data.',
        // No totalUsage field
        toolCalls: [],
      });

      const result = await router.route(options);

      expect(result.isOk()).toBe(true);
      const value = result._unsafeUnwrap();
      expect(value.tokenUsage).toEqual({ input: 0, output: 0, total: 0 });
    });
  });

  describe('SDK tool conversion', () => {
    it('converts AITool execute to SDK tool format that unwraps Result', async () => {
      const executeFn = vi.fn(async () => ok({ data: 'result' }));
      const tool = createMockTool({
        name: 'converter-test',
        description: 'Test tool for conversion',
        parameters: z.object({ query: z.string() }),
        execute: executeFn,
      });
      const caslFilter = createMockCASLFilter([tool]);
      const deps = createDefaultDeps({ caslFilter: caslFilter as never });
      const router = new IntentRouter(deps);
      const options = createDefaultRouteOptions();

      await router.route(options);

      // The SDK tool should be accessible in the generateText call
      const callArgs = mockGenerateText.mock.calls[0][0] as {
        tools: Record<
          string,
          {
            description: string;
            parameters: unknown;
            execute: (params: unknown) => Promise<unknown>;
          }
        >;
      };
      const sdkTool = callArgs.tools['converter-test'];
      expect(sdkTool).toBeDefined();
      expect(sdkTool.description).toBe('Test tool for conversion');

      // Execute the SDK tool's execute function — it should call the original tool
      // Note: truncateToolOutput stringifies non-string output
      const executeResult = await sdkTool.execute({ query: 'test' });
      expect(executeFn).toHaveBeenCalledWith({ query: 'test' });
      expect(executeResult).toBe(JSON.stringify({ data: 'result' }));
    });
  });

  describe('output truncation (Phase 2)', () => {
    it('truncates tool output when tool has maxOutputChars', async () => {
      const longResult = 'x'.repeat(500);
      const tool = createMockTool({
        name: 'long-output-tool',
        maxOutputChars: 100,
        execute: vi.fn(async () => ok(longResult)),
      });
      const caslFilter = createMockCASLFilter([tool]);
      const deps = createDefaultDeps({ caslFilter: caslFilter as never });
      const router = new IntentRouter(deps);
      const options = createDefaultRouteOptions();

      mockGenerateText.mockImplementation(async (callOpts: Record<string, unknown>) => {
        const tools = callOpts.tools as Record<
          string,
          { execute: (params: unknown) => Promise<unknown> }
        >;
        const result = await tools['long-output-tool'].execute({});
        expect(typeof result).toBe('string');
        expect((result as string).length).toBeLessThanOrEqual(100);
        expect(result as string).toContain('...[truncated');
        return defaultGenerateTextResult();
      });

      await router.route(options);
      expect(mockGenerateText).toHaveBeenCalledOnce();
    });

    it('uses global default when tool has no maxOutputChars', async () => {
      const longResult = 'y'.repeat(5000);
      const tool = createMockTool({
        name: 'default-limit-tool',
        execute: vi.fn(async () => ok(longResult)),
      });
      const caslFilter = createMockCASLFilter([tool]);
      const deps = createDefaultDeps({
        caslFilter: caslFilter as never,
        config: { defaultMaxOutputChars: 200 } as never,
      });
      const router = new IntentRouter(deps);
      const options = createDefaultRouteOptions();

      mockGenerateText.mockImplementation(async (callOpts: Record<string, unknown>) => {
        const tools = callOpts.tools as Record<
          string,
          { execute: (params: unknown) => Promise<unknown> }
        >;
        const result = await tools['default-limit-tool'].execute({});
        expect(typeof result).toBe('string');
        expect((result as string).length).toBeLessThanOrEqual(200);
        return defaultGenerateTextResult();
      });

      await router.route(options);
      expect(mockGenerateText).toHaveBeenCalledOnce();
    });

    it('does not truncate when output is under limit', async () => {
      const shortResult = 'short';
      const tool = createMockTool({
        name: 'short-output-tool',
        maxOutputChars: 1000,
        execute: vi.fn(async () => ok(shortResult)),
      });
      const caslFilter = createMockCASLFilter([tool]);
      const deps = createDefaultDeps({ caslFilter: caslFilter as never });
      const router = new IntentRouter(deps);
      const options = createDefaultRouteOptions();

      mockGenerateText.mockImplementation(async (callOpts: Record<string, unknown>) => {
        const tools = callOpts.tools as Record<
          string,
          { execute: (params: unknown) => Promise<unknown> }
        >;
        const result = await tools['short-output-tool'].execute({});
        expect(result).toBe('short');
        return defaultGenerateTextResult();
      });

      await router.route(options);
      expect(mockGenerateText).toHaveBeenCalledOnce();
    });
  });

  describe('confirmation flow (C4)', () => {
    it('returns requiresConfirmation when tool has confirmationLevel !== none', async () => {
      const tool = createMockTool({
        name: 'delete-user',
        description: 'Delete a user account',
        confirmationLevel: 'simple',
        execute: vi.fn(async () => ok('deleted')),
      });
      const caslFilter = createMockCASLFilter([tool]);
      const confirmationEngine = {
        createConfirmation: vi.fn(() =>
          ok({
            id: 'conf-123',
            userId: 'user-1',
            toolName: 'delete-user',
            params: { userId: 'target' },
            level: 'simple' as const,
            summary: 'Delete a user account',
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 300_000),
          }),
        ),
        confirm: vi.fn(),
        cancel: vi.fn(),
      };
      const deps = createDefaultDeps({
        caslFilter: caslFilter as never,
        confirmationEngine: confirmationEngine as never,
      });
      const router = new IntentRouter(deps);
      const options = createDefaultRouteOptions();

      // The SDK tool's execute will be called by generateText during the agent loop.
      // We simulate this by making generateText invoke the tool's execute callback.
      mockGenerateText.mockImplementation(async (callOpts: Record<string, unknown>) => {
        const tools = callOpts.tools as Record<
          string,
          { execute: (params: unknown) => Promise<unknown> }
        >;
        if (tools['delete-user']) {
          const callbackResult = await tools['delete-user'].execute({ userId: 'target' });
          expect(JSON.parse(callbackResult as string)).toEqual({
            status: 'confirmation_required',
            confirmationId: 'conf-123',
            toolName: 'delete-user',
          });
        }
        return {
          text: 'I will delete the user.',
          totalUsage: { inputTokens: 5, outputTokens: 3, totalTokens: 8 },
          toolCalls: [{ toolName: 'delete-user' }],
        };
      });

      const result = await router.route(options);

      expect(result.isOk()).toBe(true);
      const value = result._unsafeUnwrap();
      expect(value.response).toBe('ai-core.confirmation.required');
      expect(value.requiresConfirmation).toBeDefined();
      expect(value.requiresConfirmation!.confirmationId).toBe('conf-123');
      expect(value.requiresConfirmation!.level).toBe('simple');
      expect(value.requiresConfirmation!.summary).toBe('Delete a user account');
      // The tool's actual execute should NOT have been called
      expect(tool.execute).not.toHaveBeenCalled();
    });
  });
});
