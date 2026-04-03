import { describe, it, expect, beforeEach } from 'vitest';
import { SearchableListFieldHandler } from '../../src/fields/choice/searchable-list.field.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import type { FieldMetadata, ChoiceOption } from '../../src/input-engine.types.js';

function createMeta(overrides: Partial<FieldMetadata> = {}): FieldMetadata {
  return {
    fieldType: 'SearchableList',
    i18nKey: 'test.searchableList',
    ...overrides,
  } as FieldMetadata;
}

function createOptions(count: number): ChoiceOption[] {
  return Array.from({ length: count }, (_, i) => ({
    value: `opt_${i}`,
    label: `option.${i}`,
  }));
}

describe('SearchableListFieldHandler', () => {
  let handler: SearchableListFieldHandler;

  beforeEach(() => {
    handler = new SearchableListFieldHandler();
  });

  it('has correct fieldType', () => {
    expect(handler.fieldType).toBe('SearchableList');
  });

  describe('render', () => {
    it('returns ok(undefined)', async () => {
      const result = await handler.render(
        { conversation: undefined, ctx: undefined, formData: {} },
        createMeta(),
      );
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBeUndefined();
    });
  });

  describe('parseResponse', () => {
    it('extracts value from valid callback data', () => {
      const message = { callback_query: { data: 'ie:form1:2:opt_1' } };
      const result = handler.parseResponse(message, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('opt_1');
    });

    it('returns err when no callback_query in message', () => {
      const result = handler.parseResponse({}, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED);
    });

    it('extracts value with colons in the value part', () => {
      const message = { callback_query: { data: 'ie:form1:2:value:with:colons' } };
      const result = handler.parseResponse(message, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('value:with:colons');
    });
  });

  describe('validate', () => {
    it('returns ok when value is in static options', () => {
      const options = createOptions(3);
      const meta = createMeta({ options });
      const result = handler.validate('opt_1', undefined, meta);
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('opt_1');
    });

    it('returns err when value is not in static options', () => {
      const options = createOptions(3);
      const meta = createMeta({ options });
      const result = handler.validate('invalid_value', undefined, meta);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });

    it('returns ok for non-empty string when dataSource is provided', () => {
      const dataSourceFn = (): never => {
        throw new Error('Should not be called during sync validation');
      };
      const meta = createMeta({ dataSource: dataSourceFn });
      const result = handler.validate('some_dynamic_value', undefined, meta);
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('some_dynamic_value');
    });

    it('returns err for empty string even with dataSource', () => {
      const dataSourceFn = (): never => {
        throw new Error('Should not be called during sync validation');
      };
      const meta = createMeta({ dataSource: dataSourceFn });
      const result = handler.validate('', undefined, meta);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });
  });
});
