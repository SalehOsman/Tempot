import { describe, expect, it } from 'vitest';
import {
  PdfDocumentGenerator,
  SpreadsheetDocumentGenerator,
  createDefaultDocumentGenerators,
} from '../../src/index.js';
import type { DocumentExportRequest, DocumentTemplate } from '../../src/index.js';

const request: DocumentExportRequest = {
  exportId: 'export-rtl',
  requestedBy: 'user-1',
  moduleId: 'reports',
  format: 'pdf',
  templateId: 'report.summary',
  locale: 'ar-EG',
  payload: {
    titleKey: 'reports.summary.title',
    columns: [
      { key: 'name', labelKey: 'reports.summary.name' },
      { key: 'amount', labelKey: 'reports.summary.amount' },
    ],
    rows: [
      { name: 'account.current', amount: 1250 },
      { name: 'account.savings', amount: 875 },
    ],
  },
};

const template: DocumentTemplate = {
  templateId: 'report.summary',
  format: 'pdf',
  labelKeys: ['reports.summary.title', 'reports.summary.name', 'reports.summary.amount'],
  layoutDirection: 'rtl',
  fields: [
    { key: 'name', labelKey: 'reports.summary.name' },
    { key: 'amount', labelKey: 'reports.summary.amount' },
  ],
};

describe('DocumentGenerators', () => {
  it('should generate deterministic PDF buffers with RTL metadata', async () => {
    const generator = new PdfDocumentGenerator();

    const result = await generator.generate({ request, template });

    expect(result.isOk()).toBe(true);
    const document = result._unsafeUnwrap();
    expect(document.contentType).toBe('application/pdf');
    expect(document.fileName).toBe('export-rtl.pdf');
    expect(document.layoutDirection).toBe('rtl');
    expect(document.labelKeys).toStrictEqual(template.labelKeys);
    expect(document.buffer.toString('utf8').startsWith('%PDF-1.')).toBe(true);
    expect(document.buffer.toString('latin1')).toContain('document_engine.layout.rtl');
  });

  it('should generate deterministic spreadsheet workbooks with RTL worksheet metadata', async () => {
    const generator = new SpreadsheetDocumentGenerator();

    const result = await generator.generate({
      request: { ...request, format: 'spreadsheet' },
      template: { ...template, format: 'spreadsheet' },
    });

    expect(result.isOk()).toBe(true);
    const document = result._unsafeUnwrap();
    expect(document.contentType).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(document.fileName).toBe('export-rtl.xlsx');
    expect(document.layoutDirection).toBe('rtl');
    expect(document.buffer.subarray(0, 4).toString('latin1')).toBe('PK\u0003\u0004');
    expect(document.buffer.toString('utf8')).toContain('rightToLeft="1"');
    expect(document.buffer.toString('utf8')).toContain('reports.summary.amount');
  });

  it('should create generators for every supported format', () => {
    const generators = createDefaultDocumentGenerators();

    expect(generators.pdf).toBeInstanceOf(PdfDocumentGenerator);
    expect(generators.spreadsheet).toBeInstanceOf(SpreadsheetDocumentGenerator);
  });
});
