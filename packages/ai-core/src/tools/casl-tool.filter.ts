import type { AITool } from '../ai-core.types.js';
import type { AIAbilityChecker } from '../ai-core.contracts.js';
import type { ToolRegistry } from './tool.registry.js';

export class CASLToolFilter {
  constructor(private readonly toolRegistry: Pick<ToolRegistry, 'getAll'>) {}

  /** Filter tools to only those the user is permitted to use */
  filterForUser(abilityChecker: AIAbilityChecker): AITool[] {
    const allTools = this.toolRegistry.getAll();
    return allTools.filter((tool) =>
      abilityChecker.can(tool.requiredPermission.action, tool.requiredPermission.subject),
    );
  }
}
