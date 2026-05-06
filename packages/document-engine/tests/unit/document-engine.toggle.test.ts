import { describe, expect, it } from 'vitest';
import { ok } from 'neverthrow';
import {
  DocumentExportProcessor,
  DocumentExportQueue,
  DocumentExportRequestHandler,
  PdfDocumentGenerator,
  createDocumentExportJob,
  documentEngineToggle,
} from '../../src/index.js';
import type { DocumentExportRequest, DocumentTemplate } from '../../src/index.js';

const request: DocumentExportRequest = {
  exportId: 'export-disabled',
  requestedBy: 'user-1',
  moduleId: 'reports',
  format: 'pdf',
  templateId: 'report.summary',
  locale: 'en',
  payload: {
    titleKey: 'reports.summary.title',
    columns: [{ key: 'amount', labelKey: 'reports.summary.amount' }],
    rows: [{ amount: 100 }],
  },
};

const template: DocumentTemplate = {
  templateId: 'report.summary',
  format: 'pdf',
  labelKeys: ['reports.summary.title', 'reports.summary.amount'],
  layoutDirection: 'ltr',
  fields: [{ key: 'amount', labelKey: 'reports.summary.amount' }],
};

describe('documentEngineToggle', () => {
  it('should default to enabled when env var is not set', () => {
    delete process.env.TEMPOT_DOCUMENT_ENGINE;

    expect(documentEngineToggle.check()).toBeNull();
    expect(documentEngineToggle.isEnabled()).toBe(true);
  });

  it('should return a typed disabled error when env var is false', () => {
    process.env.TEMPOT_DOCUMENT_ENGINE = 'false';

    const result = documentEngineToggle.check();

    expect(result?.isErr()).toBe(true);
    expect(result?._unsafeUnwrapErr().code).toBe('document-engine.disabled');
    delete process.env.TEMPOT_DOCUMENT_ENGINE;
  });

  it('should block queue enqueueing when disabled', async () => {
    process.env.TEMPOT_DOCUMENT_ENGINE = 'false';
    const queue = new DocumentExportQueue({
      add: async () => undefined,
    });

    const result = await queue.enqueue(createDocumentExportJob(request));

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('document-engine.disabled');
    delete process.env.TEMPOT_DOCUMENT_ENGINE;
  });

  it('should block request handling when disabled', async () => {
    process.env.TEMPOT_DOCUMENT_ENGINE = 'false';
    const handler = new DocumentExportRequestHandler({
      queue: { enqueue: async () => ok(undefined) },
    });

    const result = await handler.handle(request);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('document-engine.disabled');
    delete process.env.TEMPOT_DOCUMENT_ENGINE;
  });

  it('should block document generation when disabled', async () => {
    process.env.TEMPOT_DOCUMENT_ENGINE = 'false';
    const generator = new PdfDocumentGenerator();

    const result = await generator.generate({ request, template });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('document-engine.disabled');
    delete process.env.TEMPOT_DOCUMENT_ENGINE;
  });

  it('should block export processing when disabled', async () => {
    process.env.TEMPOT_DOCUMENT_ENGINE = 'false';
    const processor = new DocumentExportProcessor({
      generators: {},
      storage: {
        upload: async () => ok({ storageKey: 'unused', sizeBytes: 0 }),
      },
      events: {
        publish: async () => ok(undefined),
      },
    });

    const result = await processor.process(createDocumentExportJob(request));

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('document-engine.disabled');
    delete process.env.TEMPOT_DOCUMENT_ENGINE;
  });
});
