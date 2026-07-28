import { describe, expect, it } from 'vitest';
import { createKnowledgeMenu } from '../menus/knowledge-menu.factory.js';

const labels: Record<string, string> = {
  'knowledge-management.menu.status': 'Status',
  'knowledge-management.menu.sources': 'Sources',
  'knowledge-management.menu.dry_run': 'Dry run',
  'knowledge-management.menu.write': 'Write index',
  'knowledge-management.menu.full_reindex': 'Full reindex',
  'knowledge-management.menu.history': 'History',
  'knowledge-management.menu.test_query': 'Test query',
  'knowledge-management.menu.custom_source': 'Custom source',
  'knowledge-management.menu.back': 'Back',
  'knowledge-management.source.product_help': 'Product',
  'knowledge-management.source.operations': 'Operations',
  'knowledge-management.source.architecture': 'Architecture',
  'knowledge-management.source.analysis': 'Analysis',
  'knowledge-management.source.full_project': 'Full project',
};

interface KeyboardButton {
  callback_data?: string;
  text: string;
}

interface KeyboardShape {
  inline_keyboard: KeyboardButton[][];
}

function t(key: string): string {
  return labels[key] ?? key;
}

function rows(keyboard: unknown): KeyboardButton[][] {
  return (keyboard as KeyboardShape).inline_keyboard;
}

describe('createKnowledgeMenu', () => {
  it('renders each narrow-menu action on a separate row', () => {
    const renderedRows = rows(createKnowledgeMenu(t));

    expect(renderedRows).toHaveLength(6);
    expect(renderedRows.every((row) => row.length === 1)).toBe(true);
    expect(renderedRows.flat().map((button) => button.callback_data)).toEqual([
      'knowledge:status',
      'knowledge:sources',
      'knowledge:sources',
      'knowledge:history',
      'knowledge:test_query',
      'menu:main',
    ]);
  });

  it('renders source profile actions on separate rows', () => {
    const renderedRows = rows(
      createKnowledgeMenu(t, 'sources', {
        profiles: [
          {
            id: 'product',
            labelKey: 'knowledge-management.source.product_help',
            rootLabels: ['docs/product'],
            contentType: 'ui-guide',
            languagePolicy: 'mixed',
            sourcePriority: 70,
            sourceOfTruth: false,
            mounted: true,
            custom: false,
          },
          {
            id: 'operations',
            labelKey: 'knowledge-management.source.operations',
            rootLabels: ['docs/operations'],
            contentType: 'developer-docs',
            languagePolicy: 'mixed',
            sourcePriority: 80,
            sourceOfTruth: true,
            mounted: true,
            custom: false,
          },
        ],
      }),
    );

    expect(renderedRows.every((row) => row.length === 1)).toBe(true);
    expect(renderedRows.flat().map((button) => button.callback_data)).toEqual([
      'knowledge:source:product',
      'knowledge:source:operations',
      'knowledge:custom',
      'knowledge:view',
    ]);
  });

  it('renders selected source operations with scoped callback data', () => {
    const renderedRows = rows(createKnowledgeMenu(t, 'source-actions', { profileId: 'analysis' }));

    expect(renderedRows.flat().map((button) => button.callback_data)).toEqual([
      'knowledge:dry_run:analysis',
      'knowledge:write:analysis',
      'knowledge:full_reindex:analysis',
      'knowledge:sources',
    ]);
  });
});
