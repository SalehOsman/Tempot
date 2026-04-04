import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { getFieldMetadata, buildSchemaMetadataMap } from '../../src/runner/field-metadata.util.js';

describe('getFieldMetadata', () => {
  it('returns undefined when schema has no registered metadata', () => {
    const schema = z.string();
    const result = getFieldMetadata(schema);
    expect(result).toBeUndefined();
  });

  it('returns FieldMetadata when schema has registered metadata', () => {
    const schema = z.string();
    z.globalRegistry.add(schema, {
      'input-engine': { fieldType: 'ShortText', i18nKey: 'test.field' },
    });
    const result = getFieldMetadata(schema);
    expect(result).toEqual({ fieldType: 'ShortText', i18nKey: 'test.field' });
  });
});

describe('buildSchemaMetadataMap', () => {
  it('skips fields with no metadata', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });
    // No metadata registered for either field
    const map = buildSchemaMetadataMap(schema);
    expect(map.size).toBe(0);
  });
});
