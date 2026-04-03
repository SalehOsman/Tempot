import type { AITool } from '../ai-core.types.js';
import type { AILogger, AIEventBus } from '../ai-core.contracts.js';

export class ToolRegistry {
  private readonly tools: Map<string, AITool> = new Map();
  // Reverse index: which tools belong to which module (design doc Concern 2)
  private readonly toolsByModule: Map<string, Set<string>> = new Map();

  constructor(
    private readonly logger: AILogger,
    private readonly eventBus: AIEventBus,
  ) {
    this.eventBus.subscribe('module.tools.registered', (payload: unknown) => {
      this.handleToolRegistration(payload);
    });
  }

  /** Register a single tool */
  register(tool: AITool): void {
    const existing = this.tools.get(tool.name);
    if (existing && existing.version !== tool.version) {
      this.logger.info({
        message: 'Tool version updated',
        toolName: tool.name,
        oldVersion: existing.version,
        newVersion: tool.version,
      });
      void this.eventBus.publish('ai-core.tool.version_changed', {
        toolName: tool.name,
        oldVersion: existing.version,
        newVersion: tool.version,
      });
    }
    this.tools.set(tool.name, tool);
  }

  /** Get all registered tools */
  getAll(): AITool[] {
    return Array.from(this.tools.values());
  }

  /** Get a specific tool by name */
  get(name: string): AITool | undefined {
    return this.tools.get(name);
  }

  /** Full replace per module — prevents orphaned tools (design doc Concern 2) */
  private handleToolRegistration(payload: unknown): void {
    if (payload === null || payload === undefined || typeof payload !== 'object') return;
    const data = payload as { moduleName?: string; tools?: AITool[] };
    if (!data.tools || !Array.isArray(data.tools)) return;

    const moduleName = data.moduleName ?? 'unknown';

    // 1. Remove all existing tools from this module
    const existing = this.toolsByModule.get(moduleName);
    if (existing) {
      for (const name of existing) {
        this.tools.delete(name);
      }
    }

    // 2. Register new tools
    const newNames = new Set<string>();
    for (const tool of data.tools) {
      this.tools.set(tool.name, tool);
      newNames.add(tool.name);
    }
    this.toolsByModule.set(moduleName, newNames);

    // 3. Log the update
    this.logger.info({
      message: 'Module tools registered',
      moduleName,
      toolCount: data.tools.length,
      toolNames: [...newNames],
    });
  }
}
