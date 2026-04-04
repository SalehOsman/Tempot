import { describe, it, expect } from 'vitest';
import type { FieldMetadata } from '../../src/input-engine.types.js';
import {
  formatFieldValue,
  buildConfirmationSummary,
  CONFIRMATION_ACTIONS,
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

    it('shows ✓ for true boolean', () => {
      const metadata: FieldMetadata = { fieldType: 'BooleanToggle', i18nKey: 'form.agree' };
      expect(formatFieldValue(true, metadata)).toBe('✓');
    });

    it('shows ✗ for false boolean', () => {
      const metadata: FieldMetadata = { fieldType: 'BooleanToggle', i18nKey: 'form.agree' };
      expect(formatFieldValue(false, metadata)).toBe('✗');
    });

    it('shows — for undefined value (skipped optional)', () => {
      const metadata: FieldMetadata = {
        fieldType: 'ShortText',
        i18nKey: 'form.name',
        optional: true,
      };
      expect(formatFieldValue(undefined, metadata)).toBe('—');
    });

    it('shows — for null value', () => {
      const metadata: FieldMetadata = { fieldType: 'ShortText', i18nKey: 'form.name' };
      expect(formatFieldValue(null, metadata)).toBe('—');
    });

    it('truncates values longer than 100 characters', () => {
      const metadata: FieldMetadata = { fieldType: 'LongText', i18nKey: 'form.text' };
      const longValue = 'a'.repeat(150);
      const result = formatFieldValue(longValue, metadata);
      expect(result).toBe('a'.repeat(100) + '...');
      expect(result.length).toBe(103);
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
    it('builds multi-line summary with title and field values', () => {
      const formData: Record<string, unknown> = {
        name: 'John',
        email: 'john@test.com',
      };
      const fieldMetadata = new Map<string, FieldMetadata>([
        ['name', { fieldType: 'ShortText', i18nKey: 'form.name' }],
        ['email', { fieldType: 'Email', i18nKey: 'form.email' }],
      ]);

      const result = buildConfirmationSummary(formData, fieldMetadata);

      expect(result).toContain('input-engine.confirmation.title');
      expect(result).toContain('form.name: John');
      expect(result).toContain('form.email: john@test.com');
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

      expect(result).toContain('Please confirm:');
      expect(result).toContain('Full Name: John');
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

      expect(result).toContain('form.name: John');
      expect(result).not.toContain('extraField');
    });

    it('shows — for skipped optional fields', () => {
      const formData: Record<string, unknown> = { name: undefined };
      const fieldMetadata = new Map<string, FieldMetadata>([
        ['name', { fieldType: 'ShortText', i18nKey: 'form.name', optional: true }],
      ]);

      const result = buildConfirmationSummary(formData, fieldMetadata);

      expect(result).toContain('form.name: —');
    });
  });
});
