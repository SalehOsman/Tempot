import { AppError } from '@tempot/shared';
import { err, ok } from 'neverthrow';
import { describe, expect, it } from 'vitest';
import { ImportValidator, createImportBatches } from '../../src/index.js';
import type { ImportRow, ImportSchemaAdapter, ParsedImportRow } from '../../src/index.js';

const rows: readonly ParsedImportRow[] = [
  { rowNumber: 2, data: { name: 'Ada', email: 'ada@example.test' } },
  { rowNumber: 3, data: { name: 'Grace', email: '' } },
  { rowNumber: 4, data: { name: 'Linus', email: 'linus@example.test' } },
];

class ContactsSchema implements ImportSchemaAdapter {
  async validate(row: ImportRow) {
    if (row.email === '') {
      return ok({
        status: 'invalid' as const,
        errors: [{ fieldKey: 'email', messageKey: 'contacts.email.required' }],
      });
    }
    return ok({ status: 'valid' as const, data: row });
  }
}

describe('ImportValidation', () => {
  it('should validate rows through an injected schema adapter and preserve source row numbers', async () => {
    const validator = new ImportValidator(new ContactsSchema());

    const result = await validator.validateRows(rows);

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual([
      { rowNumber: 2, status: 'valid', data: rows[0]?.data },
      {
        rowNumber: 3,
        status: 'invalid',
        errors: [{ fieldKey: 'email', messageKey: 'contacts.email.required' }],
      },
      { rowNumber: 4, status: 'valid', data: rows[2]?.data },
    ]);
  });

  it('should return typed validation setup errors from schema adapters', async () => {
    const validator = new ImportValidator({
      validate: async () => err(new AppError('contacts.schema.unavailable')),
    });

    const result = await validator.validateRows(rows);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('contacts.schema.unavailable');
  });

  it('should split valid rows into configured import batches', () => {
    const batches = createImportBatches({
      importId: 'import-1',
      moduleId: 'contacts',
      batchSize: 1,
      rows: [rows[0]?.data, rows[2]?.data],
    });

    expect(batches).toEqual([
      {
        importId: 'import-1',
        moduleId: 'contacts',
        batchNumber: 1,
        rows: [rows[0]?.data],
      },
      {
        importId: 'import-1',
        moduleId: 'contacts',
        batchNumber: 2,
        rows: [rows[2]?.data],
      },
    ]);
  });
});
