import { describe, it, expect, beforeEach } from 'vitest';
import { RegexValidatedFieldHandler } from '../../src/fields/text/regex-validated.field.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import type { FieldMetadata } from '../../src/input-engine.types.js';

function createMeta(overrides: Partial<FieldMetadata> = {}): FieldMetadata {
  return {
    fieldType: 'RegexValidated',
    i18nKey: 'test.regexValidated',
    ...overrides,
  } as FieldMetadata;
}

describe('RegexValidatedFieldHandler', () => {
  let handler: RegexValidatedFieldHandler;

  beforeEach(() => {
    handler = new RegexValidatedFieldHandler();
  });

  it('has correct fieldType', () => {
    expect(handler.fieldType).toBe('RegexValidated');
  });

  describe('parseResponse', () => {
    it('extracts and trims text from message', () => {
      const result = handler.parseResponse({ text: '  ABC-123  ' }, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('ABC-123');
    });

    it('returns err when no text in message', () => {
      const result = handler.parseResponse({}, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED);
    });
  });

  describe('validate', () => {
    it('returns ok when input matches pattern', () => {
      const result = handler.validate(
        'ABC-123',
        undefined,
        createMeta({ pattern: /^[A-Z]+-\d+$/ }),
      );
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('ABC-123');
    });

    it('returns err when input does not match pattern', () => {
      const result = handler.validate(
        'abc-123',
        undefined,
        createMeta({ pattern: /^[A-Z]+-\d+$/ }),
      );
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });

    it('returns ok when no pattern is configured (pass-through)', () => {
      const result = handler.validate('anything goes', undefined, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('anything goes');
    });

    it('returns err for empty input when pattern requires content', () => {
      const result = handler.validate('', undefined, createMeta({ pattern: /^.+$/ }));
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });
  });
});
