import { describe, it, expect, beforeEach } from 'vitest';
import { ContactFieldHandler } from '../../src/fields/media/contact.field.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import type { FieldMetadata } from '../../src/input-engine.types.js';

function createMeta(overrides: Partial<FieldMetadata> = {}): FieldMetadata {
  return {
    fieldType: 'Contact',
    i18nKey: 'test.contact',
    ...overrides,
  } as FieldMetadata;
}

describe('ContactFieldHandler', () => {
  let handler: ContactFieldHandler;

  beforeEach(() => {
    handler = new ContactFieldHandler();
  });

  it('has correct fieldType', () => {
    expect(handler.fieldType).toBe('Contact');
  });

  describe('parseResponse', () => {
    it('extracts contact info from message', () => {
      const message = {
        contact: {
          phone_number: '+201234567890',
          first_name: 'Ahmed',
          last_name: 'Ali',
          user_id: 12345,
        },
      };
      const result = handler.parseResponse(message, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual({
        phoneNumber: '+201234567890',
        firstName: 'Ahmed',
        lastName: 'Ali',
        userId: 12345,
      });
    });

    it('returns err when no contact in message', () => {
      const result = handler.parseResponse({}, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED);
    });
  });

  describe('validate', () => {
    it('returns ok for valid contact', () => {
      const value = { phoneNumber: '+201234567890', firstName: 'Ahmed' };
      const result = handler.validate(value, undefined, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(value);
    });

    it('returns err when phoneNumber is missing', () => {
      const value = { phoneNumber: '', firstName: 'Ahmed' };
      const result = handler.validate(value, undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.CONTACT_NOT_SHARED);
    });

    it('returns err when firstName is missing', () => {
      const value = { phoneNumber: '+201234567890', firstName: '' };
      const result = handler.validate(value, undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.CONTACT_NOT_SHARED);
    });
  });
});
