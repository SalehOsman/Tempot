import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import type { AITool } from '../../src/ai-core.types.js';
import type { AIAbilityChecker } from '../../src/ai-core.contracts.js';
import { CASLToolFilter } from '../../src/tools/casl-tool-filter.js';

// --- Helpers ---

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

function createMockRegistry(tools: AITool[]): { getAll: () => AITool[] } {
  return { getAll: () => tools };
}

function createMockAbility(permissions: Map<string, boolean>): AIAbilityChecker {
  return {
    can: (action: string, subject: string) => permissions.get(`${action}:${subject}`) ?? false,
  };
}

describe('CASLToolFilter', () => {
  describe('filterForUser', () => {
    it('filters out unauthorized tools', () => {
      const allowedTool = createMockTool({
        name: 'allowed-tool',
        requiredPermission: { action: 'read', subject: 'article' },
      });
      const deniedTool = createMockTool({
        name: 'denied-tool',
        requiredPermission: { action: 'delete', subject: 'article' },
      });

      const registry = createMockRegistry([allowedTool, deniedTool]);
      const ability = createMockAbility(new Map([['read:article', true]]));

      const filter = new CASLToolFilter(registry);
      const result = filter.filterForUser(ability);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(allowedTool);
    });

    it('includes authorized tools', () => {
      const toolA = createMockTool({
        name: 'tool-a',
        requiredPermission: { action: 'read', subject: 'report' },
      });
      const toolB = createMockTool({
        name: 'tool-b',
        requiredPermission: { action: 'write', subject: 'report' },
      });

      const registry = createMockRegistry([toolA, toolB]);
      const ability = createMockAbility(
        new Map([
          ['read:report', true],
          ['write:report', true],
        ]),
      );

      const filter = new CASLToolFilter(registry);
      const result = filter.filterForUser(ability);

      expect(result).toHaveLength(2);
      expect(result).toContain(toolA);
      expect(result).toContain(toolB);
    });

    it('returns empty array when registry is empty', () => {
      const registry = createMockRegistry([]);
      const ability = createMockAbility(new Map([['read:anything', true]]));

      const filter = new CASLToolFilter(registry);
      const result = filter.filterForUser(ability);

      expect(result).toEqual([]);
    });

    it('returns all tools when all are permitted', () => {
      const toolA = createMockTool({
        name: 'tool-a',
        requiredPermission: { action: 'read', subject: 'data' },
      });
      const toolB = createMockTool({
        name: 'tool-b',
        requiredPermission: { action: 'write', subject: 'data' },
      });
      const toolC = createMockTool({
        name: 'tool-c',
        requiredPermission: { action: 'delete', subject: 'data' },
      });

      const registry = createMockRegistry([toolA, toolB, toolC]);
      const ability = createMockAbility(
        new Map([
          ['read:data', true],
          ['write:data', true],
          ['delete:data', true],
        ]),
      );

      const filter = new CASLToolFilter(registry);
      const result = filter.filterForUser(ability);

      expect(result).toHaveLength(3);
      expect(result).toContain(toolA);
      expect(result).toContain(toolB);
      expect(result).toContain(toolC);
    });

    it('returns empty array when none are permitted', () => {
      const toolA = createMockTool({
        name: 'tool-a',
        requiredPermission: { action: 'read', subject: 'secret' },
      });
      const toolB = createMockTool({
        name: 'tool-b',
        requiredPermission: { action: 'write', subject: 'secret' },
      });

      const registry = createMockRegistry([toolA, toolB]);
      const ability = createMockAbility(new Map()); // No permissions

      const filter = new CASLToolFilter(registry);
      const result = filter.filterForUser(ability);

      expect(result).toEqual([]);
    });
  });
});
