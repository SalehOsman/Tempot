import { describe, it, expect } from 'vitest';
import {
  LocaleSchema,
  validateLocaleFile,
  generateSchemaFromSource,
} from '../../src/i18n.schema.js';

describe('LocaleSchema', () => {
  describe('LocaleSchema base validation', () => {
    it('should accept a valid flat locale file', () => {
      const data = {
        'common.greeting': 'Hello',
        'common.farewell': 'Goodbye',
      };

      const result = LocaleSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept nested locale objects', () => {
      const data = {
        common: {
          greeting: 'Hello',
          farewell: 'Goodbye',
        },
        auth: {
          login: 'Log in',
        },
      };

      const result = LocaleSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject non-string leaf values', () => {
      const data = {
        'common.greeting': 123,
      };

      const result = LocaleSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject empty objects', () => {
      const data = {};

      const result = LocaleSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject arrays as values', () => {
      const data = {
        'common.items': ['one', 'two'],
      };

      const result = LocaleSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('validateLocaleFile', () => {
    it('should return Ok for valid locale data', () => {
      const data = { greeting: 'Hello' };

      const result = validateLocaleFile(data);
      expect(result.isOk()).toBe(true);
    });

    it('should return Err with AppError for invalid locale data', () => {
      const data = { greeting: 42 };

      const result = validateLocaleFile(data);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('I18N_SCHEMA_VALIDATION_FAILED');
      }
    });
  });

  describe('generateSchemaFromSource', () => {
    it('should generate a schema that validates matching keys', () => {
      const sourceLocale = {
        greeting: 'مرحبا',
        farewell: 'وداعا',
      };

      const schema = generateSchemaFromSource(sourceLocale);
      const targetLocale = {
        greeting: 'Hello',
        farewell: 'Goodbye',
      };

      const result = schema.safeParse(targetLocale);
      expect(result.success).toBe(true);
    });

    it('should reject target locale missing keys from source', () => {
      const sourceLocale = {
        greeting: 'مرحبا',
        farewell: 'وداعا',
      };

      const schema = generateSchemaFromSource(sourceLocale);
      const targetLocale = {
        greeting: 'Hello',
        // missing: farewell
      };

      const result = schema.safeParse(targetLocale);
      expect(result.success).toBe(false);
    });

    it('should handle nested source locale structures', () => {
      const sourceLocale = {
        common: {
          greeting: 'مرحبا',
          farewell: 'وداعا',
        },
      };

      const schema = generateSchemaFromSource(sourceLocale);
      const targetLocale = {
        common: {
          greeting: 'Hello',
          farewell: 'Goodbye',
        },
      };

      const result = schema.safeParse(targetLocale);
      expect(result.success).toBe(true);
    });

    it('should reject target with extra keys not in source', () => {
      const sourceLocale = {
        greeting: 'مرحبا',
      };

      const schema = generateSchemaFromSource(sourceLocale);
      const targetLocale = {
        greeting: 'Hello',
        extra: 'Not in source',
      };

      // strict mode — no extra keys allowed
      const result = schema.safeParse(targetLocale);
      expect(result.success).toBe(false);
    });
  });
});
