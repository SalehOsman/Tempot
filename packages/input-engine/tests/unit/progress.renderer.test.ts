import { describe, it, expect, vi } from 'vitest';
import type { FieldMetadata } from '../../src/input-engine.types.js';
import { computeDynamicTotal, renderProgress } from '../../src/runner/progress.renderer.js';

/** Helper: create FieldMetadata with sensible defaults */
function createMeta(overrides: Partial<FieldMetadata> = {}): FieldMetadata {
  return {
    fieldType: 'ShortText',
    i18nKey: 'test.field',
    ...overrides,
  } as FieldMetadata;
}

describe('computeDynamicTotal', () => {
  it('counts all fields when no conditions exist', () => {
    const fieldNames = ['name', 'email', 'phone'];
    const allMetadata = new Map<string, FieldMetadata>([
      ['name', createMeta({ fieldType: 'ShortText', i18nKey: 'form.name' })],
      ['email', createMeta({ fieldType: 'Email', i18nKey: 'form.email' })],
      ['phone', createMeta({ fieldType: 'Phone', i18nKey: 'form.phone' })],
    ]);
    const formData: Record<string, unknown> = {};

    const total = computeDynamicTotal({ fieldNames, allMetadata, formData });

    expect(total).toBe(3);
  });

  it('excludes fields whose conditions evaluate to false', () => {
    const fieldNames = ['category', 'detail'];
    const allMetadata = new Map<string, FieldMetadata>([
      ['category', createMeta({ fieldType: 'ShortText', i18nKey: 'form.category' })],
      [
        'detail',
        createMeta({
          fieldType: 'LongText',
          i18nKey: 'form.detail',
          conditions: [{ dependsOn: 'category', operator: 'equals', value: 'other' }],
        }),
      ],
    ]);
    // category is NOT 'other', so detail should be excluded
    const formData: Record<string, unknown> = { category: 'general' };

    const total = computeDynamicTotal({ fieldNames, allMetadata, formData });

    expect(total).toBe(1);
  });

  it('dynamic total changes as formData changes (conditional visibility)', () => {
    const fieldNames = ['category', 'detail'];
    const allMetadata = new Map<string, FieldMetadata>([
      ['category', createMeta({ fieldType: 'ShortText', i18nKey: 'form.category' })],
      [
        'detail',
        createMeta({
          fieldType: 'LongText',
          i18nKey: 'form.detail',
          conditions: [{ dependsOn: 'category', operator: 'equals', value: 'other' }],
        }),
      ],
    ]);

    // Initially category is not set — detail condition fails
    const formData: Record<string, unknown> = {};
    expect(computeDynamicTotal({ fieldNames, allMetadata, formData })).toBe(1);

    // After setting category to 'other', detail becomes visible
    formData['category'] = 'other';
    expect(computeDynamicTotal({ fieldNames, allMetadata, formData })).toBe(2);

    // After changing category away from 'other', detail hides again
    formData['category'] = 'general';
    expect(computeDynamicTotal({ fieldNames, allMetadata, formData })).toBe(1);
  });

  it('accepts a custom shouldRenderFn for dependency injection', () => {
    const fieldNames = ['a', 'b', 'c'];
    const allMetadata = new Map<string, FieldMetadata>([
      ['a', createMeta({ i18nKey: 'a' })],
      ['b', createMeta({ i18nKey: 'b' })],
      ['c', createMeta({ i18nKey: 'c' })],
    ]);

    // Custom fn: only render field 'a'
    const customRender = vi.fn().mockImplementation((meta: FieldMetadata) => meta.i18nKey === 'a');

    const total = computeDynamicTotal({
      fieldNames,
      allMetadata,
      formData: {},
      shouldRenderFn: customRender,
    });

    expect(total).toBe(1);
    expect(customRender).toHaveBeenCalledTimes(3);
  });

  it('skips fields with no metadata in the map', () => {
    const fieldNames = ['name', 'unknown'];
    const allMetadata = new Map<string, FieldMetadata>([
      ['name', createMeta({ i18nKey: 'form.name' })],
      // 'unknown' has no metadata
    ]);

    const total = computeDynamicTotal({ fieldNames, allMetadata, formData: {} });

    expect(total).toBe(1);
  });

  it('O(N) performance is acceptable (< 10ms for 100 fields)', () => {
    const fieldNames: string[] = [];
    const allMetadata = new Map<string, FieldMetadata>();
    for (let i = 0; i < 100; i++) {
      const name = `field_${i}`;
      fieldNames.push(name);
      allMetadata.set(name, createMeta({ i18nKey: `form.${name}` }));
    }

    const start = performance.now();
    const total = computeDynamicTotal({ fieldNames, allMetadata, formData: {} });
    const elapsed = performance.now() - start;

    expect(total).toBe(100);
    expect(elapsed).toBeLessThan(10);
  });
});

describe('renderProgress', () => {
  it('calls t with input-engine.progress key and current/total params', () => {
    const t = vi.fn().mockReturnValue('Step 2 of 5');

    const result = renderProgress(2, 5, t);

    expect(t).toHaveBeenCalledWith('input-engine.progress', { current: 2, total: 5 });
    expect(result).toBe('Step 2 of 5');
  });

  it('returns raw key when t is undefined', () => {
    const result = renderProgress(1, 3);

    expect(result).toBe('input-engine.progress');
  });

  it('passes correct values for edge case (first field)', () => {
    const t = vi.fn().mockReturnValue('1/1');

    renderProgress(1, 1, t);

    expect(t).toHaveBeenCalledWith('input-engine.progress', { current: 1, total: 1 });
  });
});
