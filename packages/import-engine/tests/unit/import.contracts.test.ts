import { describe, expect, it } from 'vitest';
import { IMPORT_ENGINE_EVENTS, createImportJob } from '../../src/index.js';
import type {
  ImportBatchReady,
  ImportProcessSummary,
  ImportRequest,
  ImportRowResult,
} from '../../src/index.js';

const request: ImportRequest = {
  importId: 'import-1',
  requestedBy: 'user-1',
  moduleId: 'contacts',
  fileKey: 'uploads/import-1.csv',
  format: 'csv',
  locale: 'en',
  batchSize: 2,
  schemaKey: 'contacts.v1',
};

describe('ImportEngineContracts', () => {
  it('should expose stable lifecycle event names', () => {
    expect(IMPORT_ENGINE_EVENTS).toEqual({
      FILE_RECEIVED: 'import.file.received',
      BATCH_READY: 'import.batch.ready',
      PROCESS_COMPLETED: 'import.process.completed',
      PROCESS_FAILED: 'import.process.failed',
    });
  });

  it('should create queue jobs from import requests with default attempt metadata', () => {
    expect(createImportJob(request)).toEqual({
      importId: 'import-1',
      request,
      attempt: 1,
    });
  });

  it('should type valid row, invalid row, batch, and summary contracts', () => {
    const valid: ImportRowResult = {
      rowNumber: 2,
      status: 'valid',
      data: { name: 'Ada', age: 42 },
    };
    const invalid: ImportRowResult = {
      rowNumber: 3,
      status: 'invalid',
      errors: [{ fieldKey: 'email', messageKey: 'contacts.email.invalid' }],
    };
    const batch: ImportBatchReady = {
      importId: 'import-1',
      moduleId: 'contacts',
      batchNumber: 1,
      rows: [valid.data],
    };
    const summary: ImportProcessSummary = {
      importId: 'import-1',
      totalRows: 2,
      validRows: 1,
      invalidRows: 1,
      status: 'completed-with-errors',
      errorReport: { exportId: 'import-1-errors' },
    };

    expect(invalid.errors[0]?.messageKey).toBe('contacts.email.invalid');
    expect(batch.rows).toHaveLength(1);
    expect(summary.errorReport?.exportId).toBe('import-1-errors');
  });
});
