import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { SchemaValidator } from '../../src/runner/schema.validator.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import { FieldHandlerRegistry } from '../../src/fields/field.handler.js';
import type { FieldMetadata } from '../../src/input-engine.types.js';

/**
 * Register field metadata on a Zod schema instance via z.globalRegistry.
 *
 * Design Decision D3: Zod 4 global registry uses reference-based keys (like WeakMap).
 * Each test creates new schema instances → unique references → no cross-test pollution.
 * No afterEach cleanup needed for z.globalRegistry.
 */
function registerField(schema: z.ZodType, metadata: FieldMetadata): z.ZodType {
  z.globalRegistry.add(schema, { 'input-engine': metadata });
  return schema;
}

/** Create a FieldHandlerRegistry with mock handlers for the given field types */
function createRegistry(...fieldTypes: FieldMetadata['fieldType'][]): FieldHandlerRegistry {
  const registry = new FieldHandlerRegistry();
  for (const fieldType of fieldTypes) {
    registry.register({
      fieldType,
      render: async () => ({}) as never,
      parseResponse: () => ({}) as never,
      validate: () => ({}) as never,
    });
  }
  return registry;
}

describe('SchemaValidator', () => {
  it('validates a well-formed schema with multiple fields', () => {
    const nameSchema = registerField(z.string(), {
      fieldType: 'ShortText',
      i18nKey: 'form.name',
    } as FieldMetadata);
    const emailSchema = registerField(z.string(), {
      fieldType: 'Email',
      i18nKey: 'form.email',
    } as FieldMetadata);
    const formSchema = z.object({ name: nameSchema, email: emailSchema });

    const registry = createRegistry('ShortText', 'Email');
    const validator = new SchemaValidator(registry);
    const result = validator.validate(formSchema);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toHaveLength(2);
      expect(result.value[0]?.fieldType).toBe('ShortText');
      expect(result.value[1]?.fieldType).toBe('Email');
    }
  });

  it('returns err for missing i18n key (empty string)', () => {
    const schema = registerField(z.string(), {
      fieldType: 'ShortText',
      i18nKey: '',
    } as FieldMetadata);
    const formSchema = z.object({ name: schema });

    const registry = createRegistry('ShortText');
    const validator = new SchemaValidator(registry);
    const result = validator.validate(formSchema);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(INPUT_ENGINE_ERRORS.SCHEMA_INVALID);
    }
  });

  it('returns err for unknown field type (not in FieldHandlerRegistry)', () => {
    const schema = registerField(z.string(), {
      fieldType: 'Email',
      i18nKey: 'form.email',
    } as FieldMetadata);
    const formSchema = z.object({ email: schema });

    // Registry does NOT have 'Email' registered
    const registry = createRegistry('ShortText');
    const validator = new SchemaValidator(registry);
    const result = validator.validate(formSchema);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(INPUT_ENGINE_ERRORS.FIELD_TYPE_UNKNOWN);
    }
  });

  it('returns err for circular conditional dependencies (A depends on B, B depends on A)', () => {
    const fieldA = registerField(z.string(), {
      fieldType: 'ShortText',
      i18nKey: 'form.fieldA',
      conditions: [{ dependsOn: 'fieldB', operator: 'equals', value: 'yes' }],
    } as FieldMetadata);
    const fieldB = registerField(z.string(), {
      fieldType: 'ShortText',
      i18nKey: 'form.fieldB',
      conditions: [{ dependsOn: 'fieldA', operator: 'equals', value: 'yes' }],
    } as FieldMetadata);
    const formSchema = z.object({ fieldA, fieldB });

    const registry = createRegistry('ShortText');
    const validator = new SchemaValidator(registry);
    const result = validator.validate(formSchema);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(INPUT_ENGINE_ERRORS.SCHEMA_CIRCULAR_DEPENDENCY);
    }
  });

  it('returns ok for schema with conditional fields (no circular deps)', () => {
    const categorySchema = registerField(z.string(), {
      fieldType: 'SingleChoice',
      i18nKey: 'form.category',
    } as FieldMetadata);
    const detailSchema = registerField(z.string(), {
      fieldType: 'LongText',
      i18nKey: 'form.detail',
      conditions: [{ dependsOn: 'category', operator: 'equals', value: 'other' }],
    } as FieldMetadata);
    const formSchema = z.object({ category: categorySchema, detail: detailSchema });

    const registry = createRegistry('SingleChoice', 'LongText');
    const validator = new SchemaValidator(registry);
    const result = validator.validate(formSchema);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toHaveLength(2);
    }
  });

  it('returns err for field without metadata in globalRegistry', () => {
    // Create a schema WITHOUT registering metadata
    const bareSchema = z.string();
    const formSchema = z.object({ bare: bareSchema });

    const registry = createRegistry('ShortText');
    const validator = new SchemaValidator(registry);
    const result = validator.validate(formSchema);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(INPUT_ENGINE_ERRORS.SCHEMA_INVALID);
    }
  });

  it('detects transitive circular dependencies (A→B→C→A)', () => {
    const fieldA = registerField(z.string(), {
      fieldType: 'ShortText',
      i18nKey: 'form.a',
      conditions: [{ dependsOn: 'fieldC', operator: 'equals', value: 'x' }],
    } as FieldMetadata);
    const fieldB = registerField(z.string(), {
      fieldType: 'ShortText',
      i18nKey: 'form.b',
      conditions: [{ dependsOn: 'fieldA', operator: 'equals', value: 'x' }],
    } as FieldMetadata);
    const fieldC = registerField(z.string(), {
      fieldType: 'ShortText',
      i18nKey: 'form.c',
      conditions: [{ dependsOn: 'fieldB', operator: 'equals', value: 'x' }],
    } as FieldMetadata);
    const formSchema = z.object({ fieldA, fieldB, fieldC });

    const registry = createRegistry('ShortText');
    const validator = new SchemaValidator(registry);
    const result = validator.validate(formSchema);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(INPUT_ENGINE_ERRORS.SCHEMA_CIRCULAR_DEPENDENCY);
    }
  });

  it('validates an empty schema (no fields)', () => {
    const formSchema = z.object({});
    const registry = createRegistry();
    const validator = new SchemaValidator(registry);
    const result = validator.validate(formSchema);
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toHaveLength(0);
    }
  });

  it('returns err for condition referencing non-existent field', () => {
    const schema = registerField(z.string(), {
      fieldType: 'ShortText',
      i18nKey: 'form.name',
      conditions: [{ dependsOn: 'nonExistentField', operator: 'equals', value: 'x' }],
    } as FieldMetadata);
    const formSchema = z.object({ name: schema });

    const registry = createRegistry('ShortText');
    const validator = new SchemaValidator(registry);
    const result = validator.validate(formSchema);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(INPUT_ENGINE_ERRORS.SCHEMA_INVALID);
    }
  });
});
