import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import type { AITool } from '../../src/ai-core.types.js';
import type { AILogger, AIEventBus } from '../../src/ai-core.contracts.js';
import { ToolRegistry } from '../../src/tools/tool.registry.js';

// --- Helpers ---

function createMockLogger(): AILogger {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };
}

function createMockEventBus(): AIEventBus & {
  handlers: Map<string, (payload: unknown) => void>;
} {
  const handlers = new Map<string, (payload: unknown) => void>();
  return {
    handlers,
    publish: vi.fn(),
    subscribe: vi.fn((eventName: string, handler: (payload: unknown) => void) => {
      handlers.set(eventName, handler);
    }),
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
    execute: vi.fn(),
    ...overrides,
  };
}

describe('ToolRegistry', () => {
  let logger: AILogger;
  let eventBus: ReturnType<typeof createMockEventBus>;
  let registry: ToolRegistry;

  beforeEach(() => {
    vi.clearAllMocks();
    logger = createMockLogger();
    eventBus = createMockEventBus();
    registry = new ToolRegistry(logger, eventBus);
  });

  describe('register', () => {
    it('stores tool by name', () => {
      const tool = createMockTool({ name: 'my-tool' });

      registry.register(tool);

      expect(registry.get('my-tool')).toBe(tool);
    });
  });

  describe('get', () => {
    it('returns tool by name', () => {
      const tool = createMockTool({ name: 'lookup-tool' });
      registry.register(tool);

      const result = registry.get('lookup-tool');

      expect(result).toBe(tool);
      expect(result?.name).toBe('lookup-tool');
    });

    it('returns undefined for non-existent tool', () => {
      const result = registry.get('non-existent');

      expect(result).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('returns all registered tools', () => {
      const toolA = createMockTool({ name: 'tool-a' });
      const toolB = createMockTool({ name: 'tool-b' });
      const toolC = createMockTool({ name: 'tool-c' });

      registry.register(toolA);
      registry.register(toolB);
      registry.register(toolC);

      const all = registry.getAll();

      expect(all).toHaveLength(3);
      expect(all).toContain(toolA);
      expect(all).toContain(toolB);
      expect(all).toContain(toolC);
    });
  });

  describe('version update logging', () => {
    it('logs info with old and new versions when re-registering with new version', () => {
      const toolV1 = createMockTool({ name: 'versioned-tool', version: '1.0.0' });
      const toolV2 = createMockTool({ name: 'versioned-tool', version: '2.0.0' });

      registry.register(toolV1);
      registry.register(toolV2);

      expect(logger.info).toHaveBeenCalledWith({
        message: 'Tool version updated',
        toolName: 'versioned-tool',
        oldVersion: '1.0.0',
        newVersion: '2.0.0',
      });
      // The stored tool should be the updated one
      expect(registry.get('versioned-tool')).toBe(toolV2);
    });

    it('emits ai-core.tool.version_changed event when version changes', () => {
      const toolV1 = createMockTool({ name: 'versioned-tool', version: '1.0.0' });
      const toolV2 = createMockTool({ name: 'versioned-tool', version: '2.0.0' });

      registry.register(toolV1);
      registry.register(toolV2);

      expect(eventBus.publish).toHaveBeenCalledWith('ai-core.tool.version_changed', {
        toolName: 'versioned-tool',
        oldVersion: '1.0.0',
        newVersion: '2.0.0',
      });
    });

    it('does not emit version_changed event when registering same version', () => {
      const toolV1a = createMockTool({ name: 'stable-tool', version: '1.0.0' });
      const toolV1b = createMockTool({ name: 'stable-tool', version: '1.0.0' });

      registry.register(toolV1a);
      registry.register(toolV1b);

      expect(eventBus.publish).not.toHaveBeenCalled();
    });
  });

  describe('event-driven registration', () => {
    it('registers tools from module.tools.registered event', () => {
      const toolA = createMockTool({ name: 'mod-tool-a' });
      const toolB = createMockTool({ name: 'mod-tool-b' });

      // Trigger the event handler
      const handler = eventBus.handlers.get('module.tools.registered');
      expect(handler).toBeDefined();

      handler!({
        moduleName: 'cms-engine',
        tools: [toolA, toolB],
      });

      expect(registry.get('mod-tool-a')).toBe(toolA);
      expect(registry.get('mod-tool-b')).toBe(toolB);
      expect(logger.info).toHaveBeenCalledWith({
        message: 'Module tools registered',
        moduleName: 'cms-engine',
        toolCount: 2,
        toolNames: ['mod-tool-a', 'mod-tool-b'],
      });
    });

    it('handles malformed event payload gracefully (no crash)', () => {
      const handler = eventBus.handlers.get('module.tools.registered');
      expect(handler).toBeDefined();

      // These should NOT throw
      expect(() => handler!(null)).not.toThrow();
      expect(() => handler!(undefined)).not.toThrow();
      expect(() => handler!({})).not.toThrow();
      expect(() => handler!({ moduleName: 'x' })).not.toThrow();
      expect(() => handler!({ tools: 'not-an-array' })).not.toThrow();
      expect(() => handler!(42)).not.toThrow();

      // No tools should be registered from malformed payloads
      expect(registry.getAll()).toHaveLength(0);
    });
  });

  describe('getByGroup', () => {
    it('returns only tools matching the group', () => {
      registry.register(createMockTool({ name: 'a', group: 'cms' }));
      registry.register(createMockTool({ name: 'b', group: 'cms' }));
      registry.register(createMockTool({ name: 'c', group: 'search' }));

      const result = registry.getByGroup('cms');

      expect(result).toHaveLength(2);
      expect(result.map((t) => t.name)).toEqual(['a', 'b']);
    });

    it('returns empty array for unknown group', () => {
      registry.register(createMockTool({ name: 'a', group: 'cms' }));

      const result = registry.getByGroup('unknown');

      expect(result).toEqual([]);
    });

    it('returns paginated result when options provided', () => {
      for (let i = 0; i < 5; i++) {
        registry.register(createMockTool({ name: `tool-${i}`, group: 'bulk' }));
      }

      const result = registry.getByGroup('bulk', { pageSize: 2, page: 1 });

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(5);
      expect(result.totalPages).toBe(3);
    });
  });

  describe('getByGroups', () => {
    it('returns tools matching any of the provided groups', () => {
      registry.register(createMockTool({ name: 'a', group: 'cms' }));
      registry.register(createMockTool({ name: 'b', group: 'search' }));
      registry.register(createMockTool({ name: 'c', group: 'auth' }));

      const result = registry.getByGroups(['cms', 'search']);

      expect(result).toHaveLength(2);
      expect(result.map((t) => t.name).sort()).toEqual(['a', 'b']);
    });

    it('excludes tools without group property', () => {
      registry.register(createMockTool({ name: 'a', group: 'cms' }));
      registry.register(createMockTool({ name: 'b' })); // no group

      const result = registry.getByGroups(['cms']);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('a');
    });

    it('returns empty array when no tools match any group', () => {
      registry.register(createMockTool({ name: 'a', group: 'cms' }));

      const result = registry.getByGroups(['search', 'auth']);

      expect(result).toEqual([]);
    });
  });

  describe('getGroups', () => {
    it('returns sorted distinct group names', () => {
      registry.register(createMockTool({ name: 'a', group: 'cms' }));
      registry.register(createMockTool({ name: 'b', group: 'search' }));
      registry.register(createMockTool({ name: 'c', group: 'cms' }));
      registry.register(createMockTool({ name: 'd' })); // no group

      const groups = registry.getGroups();

      expect(groups).toEqual(['cms', 'search']);
    });

    it('returns empty array when no tools have groups', () => {
      registry.register(createMockTool({ name: 'a' }));
      registry.register(createMockTool({ name: 'b' }));

      const groups = registry.getGroups();

      expect(groups).toEqual([]);
    });
  });

  describe('getAll with pagination', () => {
    it('returns paginated result when options provided', () => {
      for (let i = 0; i < 5; i++) {
        registry.register(createMockTool({ name: `tool-${i}` }));
      }

      const result = registry.getAll({ pageSize: 2, page: 2 });

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(5);
      expect(result.page).toBe(2);
    });

    it('returns all tools as array when no options', () => {
      registry.register(createMockTool({ name: 'a' }));
      registry.register(createMockTool({ name: 'b' }));

      const result = registry.getAll();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
    });
  });

  describe('tools without group', () => {
    it('excludes tools without group from getByGroup queries', () => {
      registry.register(createMockTool({ name: 'grouped', group: 'cms' }));
      registry.register(createMockTool({ name: 'ungrouped' })); // no group

      const byGroup = registry.getByGroup('cms');
      expect(byGroup).toHaveLength(1);
      expect(byGroup[0].name).toBe('grouped');
    });

    it('includes tools without group in getAll', () => {
      registry.register(createMockTool({ name: 'grouped', group: 'cms' }));
      registry.register(createMockTool({ name: 'ungrouped' }));

      const all = registry.getAll();
      expect(all).toHaveLength(2);
    });
  });

  describe('full module replace (design doc Concern 2)', () => {
    it('removes old tools when module re-registers with a new set', () => {
      const handler = eventBus.handlers.get('module.tools.registered');
      expect(handler).toBeDefined();

      const toolA = createMockTool({ name: 'tool-a' });
      const toolB = createMockTool({ name: 'tool-b' });
      const toolC = createMockTool({ name: 'tool-c' });

      // First registration: module provides tools A and B
      handler!({
        moduleName: 'my-module',
        tools: [toolA, toolB],
      });

      expect(registry.get('tool-a')).toBe(toolA);
      expect(registry.get('tool-b')).toBe(toolB);

      // Second registration: module provides only tool C (replaces A+B)
      handler!({
        moduleName: 'my-module',
        tools: [toolC],
      });

      // tool-a and tool-b should be removed (orphaned tools cleaned up)
      expect(registry.get('tool-a')).toBeUndefined();
      expect(registry.get('tool-b')).toBeUndefined();
      // tool-c should exist
      expect(registry.get('tool-c')).toBe(toolC);
      expect(registry.getAll()).toHaveLength(1);
    });
  });
});
