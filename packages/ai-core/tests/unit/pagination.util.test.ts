import { describe, it, expect } from 'vitest';
import { paginate } from '../../src/pagination/pagination.util.js';

describe('paginate', () => {
  const items = Array.from({ length: 25 }, (_, i) => i + 1); // [1..25]

  it('returns first page with default options', () => {
    const result = paginate(items);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.total).toBe(25);
    expect(result.totalPages).toBe(2);
    expect(result.items).toEqual(items.slice(0, 20));
  });

  it('returns correct second page', () => {
    const result = paginate(items, { page: 2 });
    expect(result.page).toBe(2);
    expect(result.items).toEqual([21, 22, 23, 24, 25]);
    expect(result.totalPages).toBe(2);
  });

  it('returns last page correctly', () => {
    const result = paginate(items, { page: 2, pageSize: 20 });
    expect(result.items).toHaveLength(5);
    expect(result.page).toBe(2);
  });

  it('clamps page beyond max to last page', () => {
    const result = paginate(items, { page: 999 });
    expect(result.page).toBe(2);
    expect(result.items).toEqual([21, 22, 23, 24, 25]);
  });

  it('clamps page below 1 to first page', () => {
    const result = paginate(items, { page: 0 });
    expect(result.page).toBe(1);
  });

  it('handles empty array', () => {
    const result = paginate([]);
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.totalPages).toBe(0);
  });

  it('uses custom pageSize', () => {
    const result = paginate(items, { pageSize: 5 });
    expect(result.pageSize).toBe(5);
    expect(result.totalPages).toBe(5);
    expect(result.items).toHaveLength(5);
    expect(result.items).toEqual([1, 2, 3, 4, 5]);
  });

  it('handles exact page boundary', () => {
    const exactItems = Array.from({ length: 20 }, (_, i) => i + 1);
    const result = paginate(exactItems, { pageSize: 20 });
    expect(result.totalPages).toBe(1);
    expect(result.items).toHaveLength(20);
  });

  it('handles negative page gracefully', () => {
    const result = paginate(items, { page: -5 });
    expect(result.page).toBe(1);
  });
});
