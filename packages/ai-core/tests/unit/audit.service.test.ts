import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AILogger } from '../../src/ai-core.contracts.js';
import { AI_ERRORS } from '../../src/ai-core.errors.js';

// --- Mock: Langfuse ---
const mockGeneration = vi.fn();
const mockTrace = vi.fn(() => ({
  generation: mockGeneration,
}));
const mockFlushAsync = vi.fn();
const mockShutdownAsync = vi.fn();

vi.mock('langfuse', () => {
  class MockLangfuse {
    trace = mockTrace;
    flushAsync = mockFlushAsync;
    shutdownAsync = mockShutdownAsync;
  }
  return { Langfuse: MockLangfuse };
});

// --- Mock: logger ---
function createMockLogger(): AILogger {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };
}

describe('AuditService', () => {
  let service: InstanceType<(typeof import('../../src/audit/audit.service.js'))['AuditService']>;
  let logger: AILogger;

  beforeEach(async () => {
    vi.clearAllMocks();
    logger = createMockLogger();

    const { AuditService } = await import('../../src/audit/audit.service.js');
    service = new AuditService(logger);
  });

  describe('log', () => {
    it('creates Langfuse trace for generation entry', async () => {
      const entry = {
        userId: 'user-1',
        action: 'generation' as const,
        input: 'What is the weather?',
        output: 'It is sunny.',
        tokenUsage: { input: 10, output: 5, total: 15 },
        latencyMs: 250,
        success: true,
      };

      const result = await service.log(entry);

      expect(result.isOk()).toBe(true);
      expect(mockTrace).toHaveBeenCalledWith({
        name: 'generation',
        userId: 'user-1',
        metadata: {
          success: true,
          latencyMs: 250,
        },
      });
      expect(mockGeneration).toHaveBeenCalledWith({
        name: 'generation',
        input: 'What is the weather?',
        output: 'It is sunny.',
        usage: { input: 10, output: 5, total: 15 },
        metadata: {
          success: true,
          errorCode: undefined,
        },
      });
    });

    it('creates generation span for tool_call entry', async () => {
      const entry = {
        userId: 'user-2',
        action: 'tool_call' as const,
        toolName: 'calculator',
        input: '2 + 2',
        output: '4',
        latencyMs: 50,
        success: true,
      };

      const result = await service.log(entry);

      expect(result.isOk()).toBe(true);
      expect(mockTrace).toHaveBeenCalledWith({
        name: 'tool_call',
        userId: 'user-2',
        metadata: {
          success: true,
          latencyMs: 50,
        },
      });
      expect(mockGeneration).toHaveBeenCalledWith({
        name: 'calculator',
        input: '2 + 2',
        output: '4',
        usage: undefined,
        metadata: {
          success: true,
          errorCode: undefined,
        },
      });
    });

    it('creates trace for other action types (rag_search) without generation span', async () => {
      const entry = {
        userId: 'user-3',
        action: 'rag_search' as const,
        input: 'search query',
        latencyMs: 120,
        success: true,
        metadata: { resultCount: 5 },
      };

      const result = await service.log(entry);

      expect(result.isOk()).toBe(true);
      expect(mockTrace).toHaveBeenCalledWith({
        name: 'rag_search',
        userId: 'user-3',
        metadata: {
          success: true,
          latencyMs: 120,
          resultCount: 5,
        },
      });
      // generation should NOT be called for rag_search
      expect(mockGeneration).not.toHaveBeenCalled();
    });

    it('returns ok even when Langfuse throws (fire-and-log)', async () => {
      const langfuseError = new Error('Langfuse connection failed');
      mockTrace.mockImplementationOnce(() => {
        throw langfuseError;
      });

      const entry = {
        userId: 'user-4',
        action: 'generation' as const,
        input: 'test',
        latencyMs: 100,
        success: true,
      };

      const result = await service.log(entry);

      expect(result.isOk()).toBe(true);
      expect(logger.warn).toHaveBeenCalledWith({
        code: AI_ERRORS.AUDIT_LOG_FAILED,
        entry,
        error: 'Error: Langfuse connection failed',
      });
    });
  });

  describe('flush', () => {
    it('calls Langfuse flushAsync()', async () => {
      mockFlushAsync.mockResolvedValue(undefined);

      const result = await service.flush();

      expect(result.isOk()).toBe(true);
      expect(mockFlushAsync).toHaveBeenCalledOnce();
    });

    it('returns err when flushAsync throws', async () => {
      mockFlushAsync.mockRejectedValue(new Error('flush failed'));

      const result = await service.flush();

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(AI_ERRORS.AUDIT_LOG_FAILED);
    });
  });

  describe('shutdown', () => {
    it('calls Langfuse shutdownAsync()', async () => {
      mockShutdownAsync.mockResolvedValue(undefined);

      const result = await service.shutdown();

      expect(result.isOk()).toBe(true);
      expect(mockShutdownAsync).toHaveBeenCalledOnce();
    });

    it('returns err when shutdownAsync throws', async () => {
      mockShutdownAsync.mockRejectedValue(new Error('shutdown failed'));

      const result = await service.shutdown();

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(AI_ERRORS.AUDIT_LOG_FAILED);
    });
  });
});
