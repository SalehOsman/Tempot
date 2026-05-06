import { ok } from 'neverthrow';
import { describe, expect, it } from 'vitest';
import {
  CsvImportParser,
  ImportProcessor,
  ImportQueue,
  ImportRequestHandler,
  createImportJob,
  importEngineToggle,
} from '../../src/index.js';
import type { ImportRequest } from '../../src/index.js';

const request: ImportRequest = {
  importId: 'import-disabled',
  requestedBy: 'user-1',
  moduleId: 'contacts',
  fileKey: 'uploads/import-disabled.csv',
  format: 'csv',
  locale: 'en',
  batchSize: 10,
  schemaKey: 'contacts.v1',
};

describe('importEngineToggle', () => {
  it('should default to enabled when env var is not set', () => {
    delete process.env.TEMPOT_IMPORT_ENGINE;

    expect(importEngineToggle.check()).toBeNull();
    expect(importEngineToggle.isEnabled()).toBe(true);
  });

  it('should return a typed disabled error when env var is false', () => {
    process.env.TEMPOT_IMPORT_ENGINE = 'false';

    const result = importEngineToggle.check();

    expect(result?.isErr()).toBe(true);
    expect(result?._unsafeUnwrapErr().code).toBe('import-engine.disabled');
    delete process.env.TEMPOT_IMPORT_ENGINE;
  });

  it('should block queue enqueueing when disabled', async () => {
    process.env.TEMPOT_IMPORT_ENGINE = 'false';
    const queue = new ImportQueue({ add: async () => undefined });

    const result = await queue.enqueue(createImportJob(request));

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('import-engine.disabled');
    delete process.env.TEMPOT_IMPORT_ENGINE;
  });

  it('should block request handling when disabled', async () => {
    process.env.TEMPOT_IMPORT_ENGINE = 'false';
    const handler = new ImportRequestHandler({ queue: { enqueue: async () => ok(undefined) } });

    const result = await handler.handle(request);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('import-engine.disabled');
    delete process.env.TEMPOT_IMPORT_ENGINE;
  });

  it('should block parsing and processing when disabled', async () => {
    process.env.TEMPOT_IMPORT_ENGINE = 'false';
    const parserResult = await new CsvImportParser().parse(Buffer.from('email\nok'));
    const processor = new ImportProcessor({
      parsers: {},
      storage: { read: async () => ok(Buffer.from('')) },
      schema: { validate: async (row) => ok({ status: 'valid', data: row }) },
      events: { publish: async () => ok(undefined) },
      documents: { requestErrorReport: async () => ok({ exportId: 'unused' }) },
    });

    const processResult = await processor.process(createImportJob(request));

    expect(parserResult._unsafeUnwrapErr().code).toBe('import-engine.disabled');
    expect(processResult._unsafeUnwrapErr().code).toBe('import-engine.disabled');
    delete process.env.TEMPOT_IMPORT_ENGINE;
  });
});
