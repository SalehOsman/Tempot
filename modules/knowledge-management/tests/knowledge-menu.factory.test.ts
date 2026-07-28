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
  'knowledge-management.menu.back': 'Back',
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

    expect(renderedRows).toHaveLength(8);
    expect(renderedRows.every((row) => row.length === 1)).toBe(true);
    expect(renderedRows.flat().map((button) => button.callback_data)).toEqual([
      'knowledge:status',
      'knowledge:sources',
      'knowledge:dry_run',
      'knowledge:write',
      'knowledge:full_reindex',
      'knowledge:history',
      'knowledge:test_query',
      'menu:main',
    ]);
  });
});
