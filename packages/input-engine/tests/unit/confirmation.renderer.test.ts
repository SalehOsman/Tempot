import { describe, it, expect, vi } from 'vitest';
import type { FieldMetadata, TranslateFunction } from '../../src/input-engine.types.js';
import {
  formatFieldValue,
  buildConfirmationSummary,
  CONFIRMATION_ACTIONS,
  TELEGRAM_MAX_MESSAGE_LENGTH,
} from '../../src/runner/confirmation.renderer.js';

describe('ConfirmationRenderer', () => {
  describe('CONFIRMATION_ACTIONS', () => {
    it('exports CONFIRM, EDIT, CANCEL action constants', () => {
      expect(CONFIRMATION_ACTIONS.CONFIRM).toBe('__confirm__');
      expect(CONFIRMATION_ACTIONS.EDIT).toBe('__edit__');
      expect(CONFIRMATION_ACTIONS.CANCEL).toBe('__cancel__');
    });
  });

  describe('formatFieldValue', () => {
    it('shows text value as-is for ShortText field', () => {
      const metadata: FieldMetadata = { fieldType: 'ShortText', i18nKey: 'form.name' };
      expect(formatFieldValue('John Doe', metadata)).toBe('John Doe');
    });

    it('shows label from options for choice field', () => {
      const metadata: FieldMetadata = {
        fieldType: 'SingleChoice',
        i18nKey: 'form.color',
        options: [
          { value: 'red', label: 'Red Color' },
          { value: 'blue', label: 'Blue Color' },
        ],
      };
      expect(formatFieldValue('blue', metadata)).toBe('Blue Color');
    });

    it('falls back to raw value when choice value not in options', () => {
      const metadata: FieldMetadata = {
        fieldType: 'SingleChoice',
        i18nKey: 'form.color',
        options: [{ value: 'red', label: 'Red Color' }],
      };
      expect(formatFieldValue('unknown', metadata)).toBe('unknown');
    });

    it('shows i18n key for media field types via translate function', () => {
      const metadata: FieldMetadata = { fieldType: 'Photo', i18nKey: 'form.photo' };
      const t = (key: string): string => {
        if (key === 'input-engine.confirmation.file_uploaded') return 'File uploaded';
        return key;
      };
      expect(formatFieldValue('file-id-123', metadata, t)).toBe('File uploaded');
    });

    it('shows raw i18n key when no translate function provided for media', () => {
      const metadata: FieldMetadata = { fieldType: 'Document', i18nKey: 'form.doc' };
      expect(formatFieldValue('file-id', metadata)).toBe('input-engine.confirmation.file_uploaded');
    });

    it('uses i18n for true boolean via translate function', () => {
      const metadata: FieldMetadata = { fieldType: 'BooleanToggle', i18nKey: 'form.agree' };
      const mockT = vi.fn((key: string) => {
        if (key === 'input-engine.confirmation.boolean_true') return '✓';
        return key;
      }) as unknown as TranslateFunction;
      expect(formatFieldValue(true, metadata, mockT)).toBe('✓');
      expect(mockT).toHaveBeenCalledWith('input-engine.confirmation.boolean_true');
    });

    it('uses i18n for false boolean via translate function', () => {
      const metadata: FieldMetadata = { fieldType: 'BooleanToggle', i18nKey: 'form.agree' };
      const mockT = vi.fn((key: string) => {
        if (key === 'input-engine.confirmation.boolean_false') return '✗';
        return key;
      }) as unknown as TranslateFunction;
      expect(formatFieldValue(false, metadata, mockT)).toBe('✗');
      expect(mockT).toHaveBeenCalledWith('input-engine.confirmation.boolean_false');
    });

    it('uses i18n for undefined value (skipped optional)', () => {
      const metadata: FieldMetadata = {
        fieldType: 'ShortText',
        i18nKey: 'form.name',
        optional: true,
      };
      const mockT = vi.fn((key: string) => {
        if (key === 'input-engine.confirmation.empty_value') return '—';
        return key;
      }) as unknown as TranslateFunction;
      expect(formatFieldValue(undefined, metadata, mockT)).toBe('—');
      expect(mockT).toHaveBeenCalledWith('input-engine.confirmation.empty_value');
    });

    it('uses i18n for null value', () => {
      const metadata: FieldMetadata = { fieldType: 'ShortText', i18nKey: 'form.name' };
      const mockT = vi.fn((key: string) => {
        if (key === 'input-engine.confirmation.empty_value') return '—';
        return key;
      }) as unknown as TranslateFunction;
      expect(formatFieldValue(null, metadata, mockT)).toBe('—');
      expect(mockT).toHaveBeenCalledWith('input-engine.confirmation.empty_value');
    });

    it('uses i18n for truncation suffix via translate function', () => {
      const metadata: FieldMetadata = { fieldType: 'LongText', i18nKey: 'form.text' };
      const mockT = vi.fn((key: string) => {
        if (key === 'input-engine.confirmation.truncated_suffix') return '...';
        return key;
      }) as unknown as TranslateFunction;
      const longValue = 'a'.repeat(150);
      const result = formatFieldValue(longValue, metadata, mockT);
      expect(result).toBe('a'.repeat(100) + '...');
      expect(mockT).toHaveBeenCalledWith('input-engine.confirmation.truncated_suffix');
    });

    it('does not truncate values at exactly 100 characters', () => {
      const metadata: FieldMetadata = { fieldType: 'ShortText', i18nKey: 'form.name' };
      const exactValue = 'b'.repeat(100);
      expect(formatFieldValue(exactValue, metadata)).toBe(exactValue);
    });

    it('handles all media types: Video, Audio, FileGroup, Contact', () => {
      const mediaTypes = ['Video', 'Audio', 'FileGroup', 'Contact'] as const;
      for (const fieldType of mediaTypes) {
        const metadata: FieldMetadata = { fieldType, i18nKey: `form.${fieldType}` };
        expect(formatFieldValue('some-file', metadata)).toBe(
          'input-engine.confirmation.file_uploaded',
        );
      }
    });

    it('converts non-string values to string', () => {
      const metadata: FieldMetadata = { fieldType: 'Integer', i18nKey: 'form.age' };
      expect(formatFieldValue(42, metadata)).toBe('42');
    });
  });

  describe('buildConfirmationSummary', () => {
    it('returns an array of string chunks', () => {
      const formData: Record<string, unknown> = {
        name: 'John',
        email: 'john@test.com',
      };
      const fieldMetadata = new Map<string, FieldMetadata>([
        ['name', { fieldType: 'ShortText', i18nKey: 'form.name' }],
        ['email', { fieldType: 'Email', i18nKey: 'form.email' }],
      ]);

      const result = buildConfirmationSummary(formData, fieldMetadata);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(1);
      const joined = result.join('\n');
      expect(joined).toContain('input-engine.confirmation.title');
      expect(joined).toContain('form.name: John');
      expect(joined).toContain('form.email: john@test.com');
    });

    it('uses translate function for title and labels', () => {
      const formData: Record<string, unknown> = { name: 'John' };
      const fieldMetadata = new Map<string, FieldMetadata>([
        ['name', { fieldType: 'ShortText', i18nKey: 'form.name' }],
      ]);
      const t = (key: string): string => {
        const translations: Record<string, string> = {
          'input-engine.confirmation.title': 'Please confirm:',
          'form.name': 'Full Name',
        };
        return translations[key] ?? key;
      };

      const result = buildConfirmationSummary(formData, fieldMetadata, t);

      const joined = result.join('\n');
      expect(joined).toContain('Please confirm:');
      expect(joined).toContain('Full Name: John');
    });

    it('skips fields not in metadata map', () => {
      const formData: Record<string, unknown> = {
        name: 'John',
        extraField: 'value',
      };
      const fieldMetadata = new Map<string, FieldMetadata>([
        ['name', { fieldType: 'ShortText', i18nKey: 'form.name' }],
      ]);

      const result = buildConfirmationSummary(formData, fieldMetadata);

      const joined = result.join('\n');
      expect(joined).toContain('form.name: John');
      expect(joined).not.toContain('extraField');
    });

    it('shows i18n empty_value key for skipped optional fields (with default t)', () => {
      const formData: Record<string, unknown> = { name: undefined };
      const fieldMetadata = new Map<string, FieldMetadata>([
        ['name', { fieldType: 'ShortText', i18nKey: 'form.name', optional: true }],
      ]);

      const result = buildConfirmationSummary(formData, fieldMetadata);

      const joined = result.join('\n');
      expect(joined).toContain('form.name: input-engine.confirmation.empty_value');
    });

    it('splits into multiple chunks when total exceeds 4096 characters', () => {
      // Create enough fields to exceed TELEGRAM_MAX_MESSAGE_LENGTH
      const formData: Record<string, unknown> = {};
      const fieldMetadata = new Map<string, FieldMetadata>();
      // Each line: "field_NNN: " + 90 chars of value ≈ 100+ chars per line
      // Need ~50 fields to exceed 4096
      for (let i = 0; i < 60; i++) {
        const fieldName = `field_${String(i).padStart(3, '0')}`;
        formData[fieldName] = 'x'.repeat(90);
        fieldMetadata.set(fieldName, {
          fieldType: 'ShortText',
          i18nKey: `form.${fieldName}`,
        });
      }

      const result = buildConfirmationSummary(formData, fieldMetadata);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(1);
      for (const chunk of result) {
        expect(chunk.length).toBeLessThanOrEqual(TELEGRAM_MAX_MESSAGE_LENGTH);
      }
    });

    it('returns single-element array when content fits in 4096 characters', () => {
      const formData: Record<string, unknown> = { name: 'John' };
      const fieldMetadata = new Map<string, FieldMetadata>([
        ['name', { fieldType: 'ShortText', i18nKey: 'form.name' }],
      ]);

      const result = buildConfirmationSummary(formData, fieldMetadata);

      expect(result).toHaveLength(1);
    });

    it('returns array with single empty-like string for empty form', () => {
      const formData: Record<string, unknown> = {};
      const fieldMetadata = new Map<string, FieldMetadata>();

      const result = buildConfirmationSummary(formData, fieldMetadata);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(1);
    });
  });
});
