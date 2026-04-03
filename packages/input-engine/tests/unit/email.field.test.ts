import { describe, it, expect, beforeEach } from 'vitest';
import { EmailFieldHandler } from '../../src/fields/text/email.field.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import type { FieldMetadata } from '../../src/input-engine.types.js';

function createMeta(overrides: Partial<FieldMetadata> = {}): FieldMetadata {
  return {
    fieldType: 'Email',
    i18nKey: 'test.email',
    ...overrides,
  } as FieldMetadata;
}

describe('EmailFieldHandler', () => {
  let handler: EmailFieldHandler;

  beforeEach(() => {
    handler = new EmailFieldHandler();
  });

  it('has correct fieldType', () => {
    expect(handler.fieldType).toBe('Email');
  });

  describe('parseResponse', () => {
    it('extracts, trims, and lowercases text', () => {
      const result = handler.parseResponse({ text: '  User@Example.COM  ' }, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('user@example.com');
    });

    it('returns err when no text in message', () => {
      const result = handler.parseResponse({}, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED);
    });
  });

  describe('validate', () => {
    it('returns ok for valid email', () => {
      const result = handler.validate('user@example.com', undefined, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('user@example.com');
    });

    it('returns err for email without @', () => {
      const result = handler.validate('userexample.com', undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });

    it('returns err for email without domain', () => {
      const result = handler.validate('user@', undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });

    it('returns err for empty string', () => {
      const result = handler.validate('', undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });

    it('accepts email with spaces trimmed via parseResponse', () => {
      const parseResult = handler.parseResponse({ text: '  user@example.com  ' }, createMeta());
      expect(parseResult.isOk()).toBe(true);
      const validateResult = handler.validate(parseResult._unsafeUnwrap(), undefined, createMeta());
      expect(validateResult.isOk()).toBe(true);
    });

    it('normalizes uppercase via parseResponse', () => {
      const parseResult = handler.parseResponse({ text: 'USER@EXAMPLE.COM' }, createMeta());
      expect(parseResult.isOk()).toBe(true);
      expect(parseResult._unsafeUnwrap()).toBe('user@example.com');
    });
  });
});
