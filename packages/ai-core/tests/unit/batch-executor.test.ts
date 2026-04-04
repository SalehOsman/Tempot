import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ok, err } from 'neverthrow';
import { z } from 'zod';
import { AppError } from '@tempot/shared';
import type { AITool, BatchItem } from '../../src/ai-core.types.js';
import type { AILogger } from '../../src/ai-core.contracts.js';
import { AI_ERRORS } from '../../src/ai-core.errors.js';
import { ToolRegistry } from '../../src/tools/tool.registry.js';
import { executeBatch, type BatchExecutorDeps } from '../../src/tools/batch-executor.js';

// --- Helpers ---

function createMockLogger(): AILogger {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };
}

function createMockEventBus() {
  return {
    publish: vi.fn(),
    subscribe: vi.fn(),
  };
}

function createMockTool(overrides: Partial<AITool> = {}): AITool {
  return {
    name: 'test-tool',
    description: 'A test tool',
    parameters: z.object({}),
    requiredPermission: { action: 'read', subject: 'test' },
    confirmationLevel: 'none',
    version: '1.0.0',
    execute: vi.fn(async () => ok('result')),
    ...overrides,
  };
}

describe('executeBatch', () => {
  let logger: AILogger;
  let registry: ToolRegistry;
  let deps: BatchExecutorDeps;

  beforeEach(() => {
    vi.clearAllMocks();
    logger = createMockLogger();
    registry = new ToolRegistry(logger, createMockEventBus() as never);
    deps = { toolRegistry: registry, logger };
  });

  it('returns error for empty items array', async () => {
    const result = await executeBatch(deps, [], 'any-tool');

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe(AI_ERRORS.BATCH_EMPTY_ITEMS);
  });

  it('returns error when tool is not found in registry', async () => {
    const items: BatchItem<unknown>[] = [{ params: {} }];

    const result = await executeBatch(deps, items, 'nonexistent');

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe(AI_ERRORS.TOOL_NOT_FOUND);
  });

  it('includes toolName in error details when tool not found', async () => {
    const items: BatchItem<unknown>[] = [{ params: {} }];

    const result = await executeBatch(deps, items, 'missing-tool');

    expect(result.isErr()).toBe(true);
    const error = result._unsafeUnwrapErr();
    expect(error.details).toEqual({ toolName: 'missing-tool' });
  });

  it('executes all items successfully', async () => {
    const tool = createMockTool({
      name: 'add',
      execute: vi.fn(async (p) => ok(p)),
    });
    registry.register(tool);

    const items: BatchItem<unknown>[] = [
      { params: { x: 1 } },
      { params: { x: 2 } },
      { params: { x: 3 } },
    ];

    const result = await executeBatch(deps, items, 'add');

    expect(result.isOk()).toBe(true);
    const batch = result._unsafeUnwrap();
    expect(batch.summary.succeeded).toBe(3);
    expect(batch.summary.failed).toBe(0);
    expect(batch.summary.total).toBe(3);
  });

  it('handles all items failing', async () => {
    const tool = createMockTool({
      name: 'fail-tool',
      execute: vi.fn(async () => err(new AppError(AI_ERRORS.TOOL_EXECUTION_FAILED))),
    });
    registry.register(tool);

    const items: BatchItem<unknown>[] = [{ params: {} }, { params: {} }];

    const result = await executeBatch(deps, items, 'fail-tool');

    expect(result.isOk()).toBe(true);
    const batch = result._unsafeUnwrap();
    expect(batch.summary.succeeded).toBe(0);
    expect(batch.summary.failed).toBe(2);
    expect(batch.summary.total).toBe(2);
  });

  it('supports partial failure with correct per-item results', async () => {
    let callCount = 0;
    const tool = createMockTool({
      name: 'partial',
      execute: vi.fn(async () => {
        callCount++;
        if (callCount === 2) {
          return err(new AppError(AI_ERRORS.TOOL_EXECUTION_FAILED));
        }
        return ok('success');
      }),
    });
    registry.register(tool);

    const items: BatchItem<unknown>[] = [{ params: {} }, { params: {} }, { params: {} }];

    const result = await executeBatch(deps, items, 'partial');

    expect(result.isOk()).toBe(true);
    const batch = result._unsafeUnwrap();
    expect(batch.summary.succeeded).toBe(2);
    expect(batch.summary.failed).toBe(1);
    expect(batch.summary.total).toBe(3);
    expect(batch.results[0].isOk()).toBe(true);
    expect(batch.results[1].isErr()).toBe(true);
    expect(batch.results[2].isOk()).toBe(true);
  });

  it('executes items sequentially — verified by call order', async () => {
    const executionOrder: number[] = [];
    const tool = createMockTool({
      name: 'seq-tool',
      execute: vi.fn(async (p) => {
        const params = p as { index: number };
        executionOrder.push(params.index);
        return ok(params.index);
      }),
    });
    registry.register(tool);

    const items: BatchItem<unknown>[] = [
      { params: { index: 1 } },
      { params: { index: 2 } },
      { params: { index: 3 } },
    ];

    await executeBatch(deps, items, 'seq-tool');

    expect(executionOrder).toEqual([1, 2, 3]);
  });

  it('has correct summary counts with alternating success/failure', async () => {
    let callIdx = 0;
    const tool = createMockTool({
      name: 'count-tool',
      execute: vi.fn(async () => {
        callIdx++;
        return callIdx % 2 === 0 ? err(new AppError(AI_ERRORS.TOOL_EXECUTION_FAILED)) : ok('ok');
      }),
    });
    registry.register(tool);

    const items: BatchItem<unknown>[] = Array.from({ length: 4 }, () => ({ params: {} }));

    const result = await executeBatch(deps, items, 'count-tool');

    expect(result.isOk()).toBe(true);
    const batch = result._unsafeUnwrap();
    expect(batch.summary.total).toBe(4);
    expect(batch.summary.succeeded).toBe(2);
    expect(batch.summary.failed).toBe(2);
  });

  it('handles single item batch', async () => {
    const tool = createMockTool({
      name: 'single',
      execute: vi.fn(async () => ok('done')),
    });
    registry.register(tool);

    const result = await executeBatch(deps, [{ params: {} }], 'single');

    expect(result.isOk()).toBe(true);
    const batch = result._unsafeUnwrap();
    expect(batch.summary.total).toBe(1);
    expect(batch.summary.succeeded).toBe(1);
    expect(batch.summary.failed).toBe(0);
  });

  it('logs batch start with tool name and item count', async () => {
    const tool = createMockTool({
      name: 'log-test',
      execute: vi.fn(async () => ok('ok')),
    });
    registry.register(tool);

    await executeBatch(deps, [{ params: {} }], 'log-test');

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Batch execution started',
        toolName: 'log-test',
        itemCount: 1,
      }),
    );
  });

  it('logs batch end with summary', async () => {
    const tool = createMockTool({
      name: 'log-end',
      execute: vi.fn(async () => ok('ok')),
    });
    registry.register(tool);

    await executeBatch(deps, [{ params: {} }, { params: {} }], 'log-end');

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Batch execution completed',
        toolName: 'log-end',
        succeeded: 2,
        failed: 0,
        total: 2,
      }),
    );
  });

  it('passes each item params to the tool execute function', async () => {
    const executeFn = vi.fn(async (p: unknown) => ok(p));
    const tool = createMockTool({
      name: 'param-test',
      execute: executeFn,
    });
    registry.register(tool);

    const items: BatchItem<unknown>[] = [{ params: { a: 1 } }, { params: { b: 2 } }];

    await executeBatch(deps, items, 'param-test');

    expect(executeFn).toHaveBeenCalledTimes(2);
    expect(executeFn).toHaveBeenNthCalledWith(1, { a: 1 });
    expect(executeFn).toHaveBeenNthCalledWith(2, { b: 2 });
  });
});
