import { describe, it, expect, vi } from 'vitest';

vi.mock('@tempot/i18n-core', () => ({
  t: (key: string, options?: Record<string, unknown>) => {
    if (options) return `${key}:${JSON.stringify(options)}`;
    return key;
  },
}));

import { formatList } from '../../src/lists/list.formatter.js';

describe('formatList', () => {
  it('should format list with title and emoji-numbered items', () => {
    const result = formatList({
      titleKey: 'invoices.list_title',
      items: ['Invoice A', 'Invoice B', 'Invoice C'],
      renderItem: (item) => item,
    });
    expect(result.isOk()).toBe(true);
    const formatted = result._unsafeUnwrap();
    expect(formatted.text).toContain('invoices.list_title');
    expect(formatted.text).toContain('"count":3');
    expect(formatted.text).toContain('1\uFE0F\u20E3 Invoice A');
    expect(formatted.text).toContain('2\uFE0F\u20E3 Invoice B');
    expect(formatted.text).toContain('3\uFE0F\u20E3 Invoice C');
  });

  it('should pass index to renderItem callback', () => {
    const result = formatList({
      titleKey: 'items.title',
      items: ['a', 'b'],
      renderItem: (item, index) => `${item}-${index}`,
    });
    expect(result.isOk()).toBe(true);
    const formatted = result._unsafeUnwrap();
    expect(formatted.text).toContain('a-0');
    expect(formatted.text).toContain('b-1');
  });

  it('should return empty state text when items array is empty', () => {
    const result = formatList({
      titleKey: 'invoices.list_title',
      items: [],
      renderItem: (item) => String(item),
      emptyStateKey: 'invoices.no_items',
    });
    expect(result.isOk()).toBe(true);
    const formatted = result._unsafeUnwrap();
    expect(formatted.text).toContain('invoices.no_items');
    expect(formatted.text).toContain('"count":0');
  });

  it('should return emptyActionButton when items empty and config provided', () => {
    const result = formatList({
      titleKey: 'invoices.list_title',
      items: [],
      renderItem: (item) => String(item),
      emptyStateKey: 'invoices.no_items',
      emptyActionConfig: {
        label: '\u2705 Create Invoice',
        callbackData: 'invoice:create',
      },
    });
    expect(result.isOk()).toBe(true);
    const formatted = result._unsafeUnwrap();
    expect(formatted.emptyActionButton).toBeDefined();
    expect(formatted.emptyActionButton?.label).toBe('\u2705 Create Invoice');
    expect(formatted.emptyActionButton?.callbackData).toBe('invoice:create');
  });

  it('should not include emptyActionButton when items exist', () => {
    const result = formatList({
      titleKey: 'items.title',
      items: ['item'],
      renderItem: (item) => item,
    });
    expect(result.isOk()).toBe(true);
    const formatted = result._unsafeUnwrap();
    expect(formatted.emptyActionButton).toBeUndefined();
  });

  it('should format a list with more than 10 items using text numbers for overflow', () => {
    const items = Array.from({ length: 15 }, (_, i) => `Item ${i + 1}`);
    const result = formatList({
      titleKey: 'items.title',
      items,
      renderItem: (item) => item,
    });
    expect(result.isOk()).toBe(true);
    const formatted = result._unsafeUnwrap();
    // First 10 items use emoji numbers
    expect(formatted.text).toContain('1\uFE0F\u20E3 Item 1');
    expect(formatted.text).toContain('\uD83D\uDD1F Item 10');
    // Items 11+ use text numbers with dot
    expect(formatted.text).toContain('11. Item 11');
    expect(formatted.text).toContain('15. Item 15');
    expect(formatted.text).toContain('"count":15');
  });
});
