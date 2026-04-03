import { describe, it, expect, beforeEach } from 'vitest';
import { UrlFieldHandler } from '../../src/fields/text/url.field.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import type { FieldMetadata } from '../../src/input-engine.types.js';

function createMeta(overrides: Partial<FieldMetadata> = {}): FieldMetadata {
  return {
    fieldType: 'URL',
    i18nKey: 'test.url',
    ...overrides,
  } as FieldMetadata;
}

describe('UrlFieldHandler', () => {
  let handler: UrlFieldHandler;

  beforeEach(() => {
    handler = new UrlFieldHandler();
  });

  it('has correct fieldType', () => {
    expect(handler.fieldType).toBe('URL');
  });

  describe('parseResponse', () => {
    it('extracts and trims text from message', () => {
      const result = handler.parseResponse({ text: '  https://example.com  ' }, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('https://example.com');
    });

    it('returns err when no text in message', () => {
      const result = handler.parseResponse({}, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED);
    });
  });

  describe('validate', () => {
    it('returns ok for valid https URL', () => {
      const result = handler.validate('https://example.com/path?q=1', undefined, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('https://example.com/path?q=1');
    });

    it('returns ok for valid http URL', () => {
      const result = handler.validate('http://example.com', undefined, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('http://example.com');
    });

    it('returns err for invalid URL string', () => {
      const result = handler.validate('not-a-url', undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });

    it('returns err for URL with unsupported protocol', () => {
      const result = handler.validate('ftp://example.com', undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });
  });
});
