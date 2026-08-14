import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import { err, ok } from 'neverthrow';
import { IMPORT_ENGINE_ERRORS } from './import-engine.errors.js';
import { IMPORT_ENGINE_EVENTS } from './import-engine.events.js';
import { importEngineToggle } from './import-engine.toggle.js';
import { createImportBatches } from './import-batcher.js';
import type { ImportProcessorDeps } from './import-engine.ports.js';
import type {
  ImportFailure,
  ImportJob,
  ImportProcessSummary,
  ImportRow,
  ImportRowResult,
} from './import-engine.types.js';

const FAILURE_MESSAGE_KEY = 'import_engine.process.failed';

export class ImportProcessor {
  constructor(private readonly deps: ImportProcessorDeps) {}

  async process(job: ImportJob): AsyncResult<ImportProcessSummary> {
    const disabled = importEngineToggle.check();
    if (disabled) return disabled;

    const buffer = await this.deps.storage.read(job.request.fileKey);
    if (buffer.isErr()) return this.fail(job, buffer.error);

    const parser = this.deps.parsers[job.request.format];
    if (!parser) return this.fail(job, new AppError(IMPORT_ENGINE_ERRORS.UNSUPPORTED_FORMAT));

    const parsed = await parser.parse(buffer.value);
    if (parsed.isErr()) return this.fail(job, parsed.error);

    const validated = await this.validate(job, parsed.value);
    if (validated.isErr()) return this.fail(job, validated.error);

    const validRows = this.validRows(validated.value);
    const invalidRows = validated.value.filter((row) => row.status === 'invalid');
    const batches = createImportBatches({
      importId: job.importId,
      moduleId: job.request.moduleId,
      batchSize: job.request.batchSize,
      rows: validRows,
    });
    for (const batch of batches) {
      const publish = await this.deps.events.publish(IMPORT_ENGINE_EVENTS.BATCH_READY, batch);
      if (publish.isErr()) return err(new AppError(IMPORT_ENGINE_ERRORS.EVENT_PUBLISH_FAILED));
    }

    const errorReport =
      invalidRows.length > 0 ? await this.requestErrorReport(job, invalidRows) : ok(undefined);
    if (errorReport.isErr()) return this.fail(job, errorReport.error);

    const summary: ImportProcessSummary = {
      importId: job.importId,
      totalRows: parsed.value.length,
      validRows: validRows.length,
      invalidRows: invalidRows.length,
      status: invalidRows.length > 0 ? 'completed-with-errors' : 'completed',
      ...(errorReport.value ? { errorReport: errorReport.value } : {}),
    };
    const publish = await this.deps.events.publish(IMPORT_ENGINE_EVENTS.PROCESS_COMPLETED, summary);
    if (publish.isErr()) return err(new AppError(IMPORT_ENGINE_ERRORS.EVENT_PUBLISH_FAILED));
    return ok(summary);
  }

  private async validate(
    job: ImportJob,
    rows: readonly { rowNumber: number; data: ImportRow }[],
  ): AsyncResult<readonly ImportRowResult[]> {
    const results: ImportRowResult[] = [];
    for (const row of rows) {
      const validation = await this.deps.schema.validate(row.data);
      if (validation.isErr()) return err(validation.error);
      results.push(
        validation.value.status === 'valid'
          ? { rowNumber: row.rowNumber, status: 'valid', data: validation.value.data }
          : { rowNumber: row.rowNumber, status: 'invalid', errors: validation.value.errors },
      );
    }
    return ok(results);
  }

  private async requestErrorReport(job: ImportJob, invalidRows: readonly ImportRowResult[]) {
    return this.deps.documents.requestErrorReport({
      exportId: `${job.importId}-errors`,
      requestedBy: job.request.requestedBy,
      moduleId: job.request.moduleId,
      format: 'spreadsheet',
      templateId: 'import_engine.error_report',
      locale: job.request.locale,
      payload: {
        titleKey: 'import_engine.error_report.title',
        columns: [
          { key: 'rowNumber', labelKey: 'import_engine.error_report.row_number' },
          { key: 'fieldKey', labelKey: 'import_engine.error_report.field_key' },
          { key: 'messageKey', labelKey: 'import_engine.error_report.message_key' },
        ],
        rows: invalidRows.flatMap((row) =>
          (row.errors ?? []).map((issue) => ({
            rowNumber: row.rowNumber,
            fieldKey: issue.fieldKey,
            messageKey: issue.messageKey,
          })),
        ),
      },
    });
  }

  private async fail(job: ImportJob, error: AppError): AsyncResult<ImportProcessSummary> {
    const failure: ImportFailure = {
      importId: job.importId,
      errorCode: error.code,
      messageKey: FAILURE_MESSAGE_KEY,
      retryable: true,
    };
    const publish = await this.deps.events.publish(IMPORT_ENGINE_EVENTS.PROCESS_FAILED, failure);
    if (publish.isErr()) return err(new AppError(IMPORT_ENGINE_ERRORS.EVENT_PUBLISH_FAILED));
    return err(error);
  }

  private validRows(results: readonly ImportRowResult[]): readonly ImportRow[] {
    return results.flatMap((row) => (row.status === 'valid' && row.data ? [row.data] : []));
  }
}
