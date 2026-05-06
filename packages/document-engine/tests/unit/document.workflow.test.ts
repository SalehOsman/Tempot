import { AppError } from '@tempot/shared';
import { err, ok } from 'neverthrow';
import { describe, expect, it } from 'vitest';
import {
  DOCUMENT_ENGINE_EVENTS,
  DocumentExportProcessor,
  DocumentExportQueue,
  DocumentExportRequestHandler,
  createDocumentExportJob,
} from '../../src/index.js';
import type {
  DocumentEventPublisher,
  DocumentExportRequest,
  DocumentGenerator,
  DocumentStoragePort,
  QueuedDocumentExport,
} from '../../src/index.js';

const request: DocumentExportRequest = {
  exportId: 'export-1',
  requestedBy: 'user-1',
  moduleId: 'reports',
  format: 'pdf',
  templateId: 'report.summary',
  locale: 'en',
  payload: {
    titleKey: 'reports.summary.title',
    columns: [{ key: 'amount', labelKey: 'reports.summary.amount' }],
    rows: [{ amount: 1250 }],
  },
};

class MemoryQueueLike {
  readonly jobs: QueuedDocumentExport[] = [];

  async add(name: string, data: QueuedDocumentExport): Promise<void> {
    this.jobs.push({ ...data, queueName: name });
  }
}

class MemoryEvents implements DocumentEventPublisher {
  readonly events: Array<{ name: string; payload: unknown }> = [];

  async publish(name: string, payload: unknown) {
    this.events.push({ name, payload });
    return ok(undefined);
  }
}

class MemoryStorage implements DocumentStoragePort {
  readonly uploads: Array<{ key: string; contentType: string; sizeBytes: number }> = [];

  async upload(input: { key: string; contentType: string; buffer: Buffer }) {
    this.uploads.push({
      key: input.key,
      contentType: input.contentType,
      sizeBytes: input.buffer.byteLength,
    });
    return ok({
      storageKey: input.key,
      downloadUrl: `tempot://${input.key}`,
      sizeBytes: input.buffer.byteLength,
    });
  }
}

const generator: DocumentGenerator = {
  generate: async ({ request: exportRequest }) =>
    ok({
      exportId: exportRequest.exportId,
      buffer: Buffer.from('%PDF-1.4 deterministic fixture'),
      contentType: 'application/pdf',
      fileName: `${exportRequest.exportId}.pdf`,
      labelKeys: ['reports.summary.title'],
      layoutDirection: 'ltr',
    }),
};

describe('DocumentWorkflow', () => {
  it('should enqueue document export requests through the queue abstraction', async () => {
    const queueLike = new MemoryQueueLike();
    const queue = new DocumentExportQueue(queueLike);
    const handler = new DocumentExportRequestHandler({ queue });

    const result = await handler.handle(request);

    expect(result.isOk()).toBe(true);
    expect(queueLike.jobs).toHaveLength(1);
    expect(queueLike.jobs[0]).toMatchObject({
      queueName: 'document.export',
      exportId: 'export-1',
      attempt: 1,
    });
  });

  it('should upload generated files and publish completion events', async () => {
    const events = new MemoryEvents();
    const storage = new MemoryStorage();
    const processor = new DocumentExportProcessor({
      generators: { pdf: generator },
      storage,
      events,
    });

    const result = await processor.process(createDocumentExportJob(request));

    expect(result.isOk()).toBe(true);
    expect(storage.uploads[0]).toMatchObject({
      key: 'reports/export-1.pdf',
      contentType: 'application/pdf',
    });
    expect(events.events[0]).toMatchObject({
      name: DOCUMENT_ENGINE_EVENTS.EXPORT_COMPLETED,
      payload: { exportId: 'export-1', storageKey: 'reports/export-1.pdf' },
    });
  });

  it('should publish failure events when generation fails', async () => {
    const events = new MemoryEvents();
    const storage = new MemoryStorage();
    const processor = new DocumentExportProcessor({
      generators: {
        pdf: {
          generate: async () => err(new AppError('document_engine.generation_failed')),
        },
      },
      storage,
      events,
    });

    const result = await processor.process(createDocumentExportJob(request));

    expect(result.isErr()).toBe(true);
    expect(storage.uploads).toHaveLength(0);
    expect(events.events[0]).toMatchObject({
      name: DOCUMENT_ENGINE_EVENTS.EXPORT_FAILED,
      payload: {
        exportId: 'export-1',
        errorCode: 'document_engine.generation_failed',
        messageKey: 'document_engine.export.failed',
      },
    });
  });

  it('should publish failure events when storage upload fails', async () => {
    const events = new MemoryEvents();
    const storage: DocumentStoragePort = {
      upload: async () => err(new AppError('document_engine.storage_upload_failed')),
    };
    const processor = new DocumentExportProcessor({
      generators: { pdf: generator },
      storage,
      events,
    });

    const result = await processor.process(createDocumentExportJob(request));

    expect(result.isErr()).toBe(true);
    expect(events.events[0]).toMatchObject({
      name: DOCUMENT_ENGINE_EVENTS.EXPORT_FAILED,
      payload: {
        exportId: 'export-1',
        errorCode: 'document_engine.storage_upload_failed',
      },
    });
  });

  it('should return typed event errors when completion event publishing fails', async () => {
    const storage = new MemoryStorage();
    const events: DocumentEventPublisher = {
      publish: async () => err(new AppError('event_bus.publish_failed')),
    };
    const processor = new DocumentExportProcessor({
      generators: { pdf: generator },
      storage,
      events,
    });

    const result = await processor.process(createDocumentExportJob(request));

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('document_engine.event_publish_failed');
  });

  it('should return typed event errors when failure event publishing fails', async () => {
    const storage = new MemoryStorage();
    const events: DocumentEventPublisher = {
      publish: async () => err(new AppError('event_bus.publish_failed')),
    };
    const processor = new DocumentExportProcessor({
      generators: {
        pdf: {
          generate: async () => err(new AppError('document_engine.generation_failed')),
        },
      },
      storage,
      events,
    });

    const result = await processor.process(createDocumentExportJob(request));

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('document_engine.event_publish_failed');
  });
});
