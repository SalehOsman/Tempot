import { AppError } from '@tempot/shared';
import { err, ok } from 'neverthrow';
import { describe, expect, it } from 'vitest';
import {
  IMPORT_ENGINE_EVENTS,
  ImportProcessor,
  ImportQueue,
  ImportRequestHandler,
  createImportJob,
} from '../../src/index.js';
import type {
  ImportDocumentReportRequester,
  ImportEventPublisher,
  ImportParser,
  ImportQueueLike,
  ImportRequest,
  ImportSchemaAdapter,
  ImportStoragePort,
  QueuedImportJob,
} from '../../src/index.js';

const request: ImportRequest = {
  importId: 'import-1',
  requestedBy: 'user-1',
  moduleId: 'contacts',
  fileKey: 'uploads/import-1.csv',
  format: 'csv',
  locale: 'en',
  batchSize: 1,
  schemaKey: 'contacts.v1',
};

class MemoryQueueLike implements ImportQueueLike {
  readonly jobs: QueuedImportJob[] = [];

  async add(name: string, data: QueuedImportJob): Promise<void> {
    this.jobs.push({ ...data, queueName: name });
  }
}

class MemoryEvents implements ImportEventPublisher {
  readonly events: Array<{ name: string; payload: unknown }> = [];

  async publish(name: string, payload: unknown) {
    this.events.push({ name, payload });
    return ok(undefined);
  }
}

class MemoryDocuments implements ImportDocumentReportRequester {
  readonly requests: unknown[] = [];

  async requestErrorReport(reportRequest: unknown) {
    this.requests.push(reportRequest);
    return ok({ exportId: 'import-1-errors' });
  }
}

const storage: ImportStoragePort = {
  read: async () => ok(Buffer.from('fixture')),
};

const parser: ImportParser = {
  parse: async () =>
    ok([
      { rowNumber: 2, data: { email: 'ada@example.test' } },
      { rowNumber: 3, data: { email: '' } },
    ]),
};

const schema: ImportSchemaAdapter = {
  validate: async (row) => {
    if (row.email === '') {
      return ok({
        status: 'invalid',
        errors: [{ fieldKey: 'email', messageKey: 'contacts.email.required' }],
      });
    }
    return ok({ status: 'valid', data: row });
  },
};

describe('ImportWorkflow', () => {
  it('should enqueue import requests through the queue abstraction', async () => {
    const queueLike = new MemoryQueueLike();
    const queue = new ImportQueue(queueLike);
    const handler = new ImportRequestHandler({ queue });

    const result = await handler.handle(request);

    expect(result.isOk()).toBe(true);
    expect(queueLike.jobs[0]).toMatchObject({
      queueName: 'import.process',
      importId: 'import-1',
      attempt: 1,
    });
  });

  it('should emit valid batches, request invalid-row reports, and publish completion', async () => {
    const events = new MemoryEvents();
    const documents = new MemoryDocuments();
    const processor = new ImportProcessor({
      parsers: { csv: parser },
      storage,
      schema,
      events,
      documents,
    });

    const result = await processor.process(createImportJob(request));

    expect(result.isOk()).toBe(true);
    expect(events.events[0]).toMatchObject({
      name: IMPORT_ENGINE_EVENTS.BATCH_READY,
      payload: { importId: 'import-1', batchNumber: 1, rows: [{ email: 'ada@example.test' }] },
    });
    expect(documents.requests[0]).toMatchObject({
      exportId: 'import-1-errors',
      format: 'spreadsheet',
      moduleId: 'contacts',
    });
    expect(events.events.at(-1)).toMatchObject({
      name: IMPORT_ENGINE_EVENTS.PROCESS_COMPLETED,
      payload: {
        importId: 'import-1',
        totalRows: 2,
        validRows: 1,
        invalidRows: 1,
        status: 'completed-with-errors',
        errorReport: { exportId: 'import-1-errors' },
      },
    });
  });

  it('should complete without an error report when all rows are valid', async () => {
    const events = new MemoryEvents();
    const documents = new MemoryDocuments();
    const processor = new ImportProcessor({
      parsers: { csv: { parse: async () => ok([{ rowNumber: 2, data: { email: 'ok' } }]) } },
      storage,
      schema: { validate: async (row) => ok({ status: 'valid', data: row }) },
      events,
      documents,
    });

    const result = await processor.process(createImportJob(request));

    expect(result.isOk()).toBe(true);
    expect(documents.requests).toHaveLength(0);
    expect(result._unsafeUnwrap().status).toBe('completed');
  });

  it('should publish failure events when parsing fails', async () => {
    const events = new MemoryEvents();
    const processor = new ImportProcessor({
      parsers: {
        csv: { parse: async () => err(new AppError('import_engine.parse_failed')) },
      },
      storage,
      schema,
      events,
      documents: new MemoryDocuments(),
    });

    const result = await processor.process(createImportJob(request));

    expect(result.isErr()).toBe(true);
    expect(events.events[0]).toMatchObject({
      name: IMPORT_ENGINE_EVENTS.PROCESS_FAILED,
      payload: {
        importId: 'import-1',
        errorCode: 'import_engine.parse_failed',
        messageKey: 'import_engine.process.failed',
      },
    });
  });
});
