import { ok, err } from 'neverthrow';
import type { Result } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import type { BatchItem, BatchResult } from '../ai-core.types.js';
import type { AILogger } from '../ai-core.contracts.js';
import type { ToolRegistry } from './tool.registry.js';
import { AI_ERRORS } from '../ai-core.errors.js';

/** Dependencies for batch executor */
export interface BatchExecutorDeps {
  toolRegistry: ToolRegistry;
  logger: AILogger;
}

/** Execute a batch of tool calls sequentially with partial failure support */
export async function executeBatch(
  deps: BatchExecutorDeps,
  items: BatchItem<unknown>[],
  toolName: string,
): Promise<Result<BatchResult, AppError>> {
  if (items.length === 0) {
    return err(new AppError(AI_ERRORS.BATCH_EMPTY_ITEMS));
  }

  const tool = deps.toolRegistry.get(toolName);
  if (!tool) {
    return err(new AppError(AI_ERRORS.TOOL_NOT_FOUND, { toolName }));
  }

  deps.logger.info({
    message: 'Batch execution started',
    toolName,
    itemCount: items.length,
  });

  const results: Array<Result<unknown, AppError>> = [];
  let succeeded = 0;
  let failed = 0;

  for (const item of items) {
    const result = await tool.execute(item.params);
    results.push(result);
    if (result.isOk()) {
      succeeded++;
    } else {
      failed++;
    }
  }

  const summary = { succeeded, failed, total: items.length };

  deps.logger.info({
    message: 'Batch execution completed',
    toolName,
    ...summary,
  });

  return ok({ results, summary });
}
