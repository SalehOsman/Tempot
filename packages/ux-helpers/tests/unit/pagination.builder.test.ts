import { describe, it, expect, vi } from 'vitest';

vi.mock('@tempot/i18n-core', () => ({
  t: (key: string, options?: Record<string, unknown>) => {
    if (options) return `${key}:${JSON.stringify(options)}`;
    return key;
  },
}));

import { buildPagination } from '../../src/lists/pagination.builder.js';

describe('buildPagination', () => {
  it('should return empty keyboard for single page', () => {
    const result = buildPagination({
      currentPage: 1,
      totalPages: 1,
      callbackPrefix: 'invoices',
    });
    expect(result.isOk()).toBe(true);
    const keyboard = result._unsafeUnwrap();
    const rows = (keyboard as unknown as { inline_keyboard: unknown[][] }).inline_keyboard;
    expect(rows.length === 0 || rows[0]?.length === 0).toBe(true);
  });

  it('should show only Next button on first page', () => {
    const result = buildPagination({
      currentPage: 1,
      totalPages: 5,
      callbackPrefix: 'invoices',
    });
    expect(result.isOk()).toBe(true);
    const keyboard = result._unsafeUnwrap();
    const rows = (
      keyboard as unknown as { inline_keyboard: { text: string; callback_data: string }[][] }
    ).inline_keyboard;
    const buttons = rows[0]!;
    // Should NOT have Previous button
    const prevButton = buttons.find((b) => b.callback_data.includes('page:0'));
    expect(prevButton).toBeUndefined();
    // Should have page indicator
    const indicator = buttons.find((b) => b.text.includes('common.pagination.indicator'));
    expect(indicator).toBeDefined();
    // Should have Next button
    const nextButton = buttons.find((b) => b.callback_data === 'invoices:page:2');
    expect(nextButton).toBeDefined();
  });

  it('should show only Previous button on last page', () => {
    const result = buildPagination({
      currentPage: 5,
      totalPages: 5,
      callbackPrefix: 'invoices',
    });
    expect(result.isOk()).toBe(true);
    const keyboard = result._unsafeUnwrap();
    const rows = (
      keyboard as unknown as { inline_keyboard: { text: string; callback_data: string }[][] }
    ).inline_keyboard;
    const buttons = rows[0]!;
    // Should have Previous button
    const prevButton = buttons.find((b) => b.callback_data === 'invoices:page:4');
    expect(prevButton).toBeDefined();
    // Should NOT have Next button
    const nextButton = buttons.find((b) => b.callback_data === 'invoices:page:6');
    expect(nextButton).toBeUndefined();
  });

  it('should show both buttons on middle page', () => {
    const result = buildPagination({
      currentPage: 3,
      totalPages: 5,
      callbackPrefix: 'invoices',
    });
    expect(result.isOk()).toBe(true);
    const keyboard = result._unsafeUnwrap();
    const rows = (
      keyboard as unknown as { inline_keyboard: { text: string; callback_data: string }[][] }
    ).inline_keyboard;
    const buttons = rows[0]!;
    const prevButton = buttons.find((b) => b.callback_data === 'invoices:page:2');
    expect(prevButton).toBeDefined();
    const nextButton = buttons.find((b) => b.callback_data === 'invoices:page:4');
    expect(nextButton).toBeDefined();
  });

  it('should include page indicator with current/total', () => {
    const result = buildPagination({
      currentPage: 2,
      totalPages: 5,
      callbackPrefix: 'invoices',
    });
    expect(result.isOk()).toBe(true);
    const keyboard = result._unsafeUnwrap();
    const rows = (
      keyboard as unknown as { inline_keyboard: { text: string; callback_data: string }[][] }
    ).inline_keyboard;
    const buttons = rows[0]!;
    const indicator = buttons.find(
      (b) => b.text.includes('"current":2') && b.text.includes('"total":5'),
    );
    expect(indicator).toBeDefined();
  });
});
