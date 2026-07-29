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
  'knowledge-management.menu.providers': 'Providers',
  'knowledge-management.menu.chat_provider': 'Chat provider',
  'knowledge-management.menu.embedding_provider': 'Embedding provider',
  'knowledge-management.menu.embedding_model': 'Embedding model',
  'knowledge-management.menu.provider_gemini': 'Gemini',
  'knowledge-management.menu.provider_openai': 'OpenAI',
  'knowledge-management.menu.provider_deepseek': 'DeepSeek',
  'knowledge-management.menu.current_option': 'Current: {{label}}',
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

function t(key: string, options?: Record<string, unknown>): string {
  const label = labels[key] ?? key;
  if (!options) return label;
  return Object.entries(options).reduce(
    (text, [name, value]) => text.replace(`{{${name}}}`, String(value)),
    label,
  );
}

function rows(keyboard: unknown): KeyboardButton[][] {
  return (keyboard as KeyboardShape).inline_keyboard;
}

describe('createKnowledgeMenu', () => {
  it('renders each narrow-menu action on a separate row', () => {
    const renderedRows = rows(createKnowledgeMenu(t));

    expect(renderedRows).toHaveLength(7);
    expect(renderedRows.every((row) => row.length === 1)).toBe(true);
    expect(renderedRows.flat().map((button) => button.callback_data)).toEqual([
      'knowledge:status',
      'knowledge:sources',
      'knowledge:sources',
      'knowledge:history',
      'knowledge:test_query',
      'knowledge:providers',
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

  it('renders provider settings actions on separate rows', () => {
    const renderedRows = rows(createKnowledgeMenu(t, 'providers'));

    expect(renderedRows.every((row) => row.length === 1)).toBe(true);
    expect(renderedRows.flat().map((button) => button.callback_data)).toEqual([
      'knowledge:providers:chat',
      'knowledge:providers:embedding',
      'knowledge:providers:model',
      'knowledge:view',
    ]);
  });

  it('renders chat provider choices including deepseek', () => {
    const renderedRows = rows(createKnowledgeMenu(t, 'chat-providers'));

    expect(renderedRows.flat().map((button) => button.callback_data)).toEqual([
      'knowledge:providers:chat:set:gemini',
      'knowledge:providers:chat:set:openai',
      'knowledge:providers:chat:set:deepseek',
      'knowledge:providers',
    ]);
  });

  it('marks the active chat provider clearly', () => {
    const renderedRows = rows(
      createKnowledgeMenu(t, 'chat-providers', {
        providerSettings: {
          chatProvider: 'openai',
          chatProviderConfigured: true,
          embeddingProvider: 'gemini',
          embeddingProviderConfigured: true,
          embeddingModel: 'gemini-embedding-2-preview',
        },
      }),
    );

    expect(renderedRows.flat().map((button) => button.text)).toEqual([
      'Gemini',
      'Current: OpenAI',
      'DeepSeek',
      'Back',
    ]);
    expect(renderedRows.flat().map((button) => button.callback_data)).toContain(
      'knowledge:providers',
    );
  });
});
