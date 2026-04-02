import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import type { AITool } from '../../src/ai-core.types.js';
import { AlternativeSuggestions } from '../../src/suggestions/alternative-suggestions.js';

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

describe('AlternativeSuggestions', () => {
  describe('suggest', () => {
    it('returns matching tool descriptions', () => {
      const tools = [
        createMockTool({
          name: 'report.generate',
          description: 'Generate a weekly report',
        }),
        createMockTool({
          name: 'email.send',
          description: 'Send an email notification',
        }),
      ];

      const suggestions = new AlternativeSuggestions();
      const result = suggestions.suggest('generate report', tools);

      expect(result).toContain('Generate a weekly report');
    });

    it('enforces maxSuggestions limit (default 3)', () => {
      const tools = [
        createMockTool({
          name: 'search.users',
          description: 'Search for users in the system',
        }),
        createMockTool({
          name: 'search.articles',
          description: 'Search for articles in the database',
        }),
        createMockTool({
          name: 'search.logs',
          description: 'Search through application logs',
        }),
        createMockTool({
          name: 'search.files',
          description: 'Search for files in storage',
        }),
      ];

      const suggestions = new AlternativeSuggestions();
      const result = suggestions.suggest('search', tools);

      expect(result).toHaveLength(3);
    });

    it('returns empty array when no tools match', () => {
      const tools = [
        createMockTool({
          name: 'report.generate',
          description: 'Generate a weekly report',
        }),
        createMockTool({
          name: 'email.send',
          description: 'Send an email notification',
        }),
      ];

      const suggestions = new AlternativeSuggestions();
      const result = suggestions.suggest('xyz-nonexistent-query', tools);

      expect(result).toEqual([]);
    });

    it('results ordered by score (highest first)', () => {
      const tools = [
        createMockTool({
          name: 'data.export',
          description: 'Export data to CSV format',
        }),
        createMockTool({
          name: 'report.export',
          description: 'Export report data as PDF',
        }),
      ];

      const suggestions = new AlternativeSuggestions();
      // "export report" matches both tools, but 'report.export' matches
      // "export" in name (+2) + "export" in description (+1) + "report" in name (+2) + "report" in description (+1) = 6
      // 'data.export' matches "export" in name (+2) + "export" in description (+1) = 3
      const result = suggestions.suggest('export report', tools);

      expect(result).toHaveLength(2);
      expect(result[0]).toBe('Export report data as PDF');
      expect(result[1]).toBe('Export data to CSV format');
    });

    it('name matches weighted higher than description matches', () => {
      const tools = [
        createMockTool({
          name: 'analytics.dashboard',
          description: 'View system metrics and statistics',
        }),
        createMockTool({
          name: 'metrics.overview',
          description: 'Display analytics dashboard summary',
        }),
      ];

      const suggestions = new AlternativeSuggestions();
      // "analytics" query:
      // First tool: "analytics" in name (+2) = 2
      // Second tool: "analytics" in description (+1) = 1
      const result = suggestions.suggest('analytics', tools);

      expect(result).toHaveLength(2);
      // Tool with name match should come first (score 2 vs score 1)
      expect(result[0]).toBe('View system metrics and statistics');
      expect(result[1]).toBe('Display analytics dashboard summary');
    });

    it('respects custom maxSuggestions parameter', () => {
      const tools = [
        createMockTool({
          name: 'search.users',
          description: 'Search for users',
        }),
        createMockTool({
          name: 'search.articles',
          description: 'Search for articles',
        }),
        createMockTool({
          name: 'search.logs',
          description: 'Search through logs',
        }),
      ];

      const suggestions = new AlternativeSuggestions();
      const result = suggestions.suggest('search', tools, 1);

      expect(result).toHaveLength(1);
    });

    it('handles empty tools array', () => {
      const suggestions = new AlternativeSuggestions();
      const result = suggestions.suggest('anything', []);

      expect(result).toEqual([]);
    });
  });
});
