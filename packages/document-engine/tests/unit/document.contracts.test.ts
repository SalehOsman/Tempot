import { describe, expect, it } from 'vitest';
import { DOCUMENT_ENGINE_EVENTS, createDocumentExportJob } from '../../src/index.js';
import type { DocumentExportRequest, DocumentTemplate } from '../../src/index.js';

const request: DocumentExportRequest = {
  exportId: 'export-1',
  requestedBy: 'user-1',
  moduleId: 'reports',
  format: 'pdf',
  templateId: 'report.summary',
  locale: 'ar-EG',
  payload: {
    titleKey: 'reports.summary.title',
    columns: [{ key: 'amount', labelKey: 'reports.summary.amount' }],
    rows: [{ amount: 1250 }],
  },
};

describe('DocumentEngineContracts', () => {
  it('should create queue jobs from export requests with default attempt metadata', () => {
    const job = createDocumentExportJob(request);

    expect(job).toStrictEqual({
      exportId: 'export-1',
      request,
      attempt: 1,
    });
  });

  it('should expose stable event names for request, completion, and failure', () => {
    expect(DOCUMENT_ENGINE_EVENTS).toStrictEqual({
      EXPORT_REQUESTED: 'document.export.requested',
      EXPORT_COMPLETED: 'document.export.completed',
      EXPORT_FAILED: 'document.export.failed',
    });
  });

  it('should keep templates based on i18n label keys and layout metadata', () => {
    const template: DocumentTemplate = {
      templateId: 'report.summary',
      format: 'pdf',
      labelKeys: ['reports.summary.title', 'reports.summary.amount'],
      layoutDirection: 'rtl',
      fields: [{ key: 'amount', labelKey: 'reports.summary.amount' }],
    };

    expect(template.labelKeys.every((key) => key.includes('.'))).toBe(true);
    expect(template.layoutDirection).toBe('rtl');
  });
});
