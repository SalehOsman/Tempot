import type { AppError, AsyncResult } from '@tempot/shared';
import type {
  ImportBatchReady,
  ImportErrorReport,
  ImportFormat,
  ImportJob,
  ImportProcessSummary,
  ImportRow,
  ImportValidationIssue,
  ParsedImportRow,
} from './import-engine.types.js';

export type ImportValidationOutcome =
  | { status: 'valid'; data: ImportRow }
  | { status: 'invalid'; errors: readonly ImportValidationIssue[] };

export interface ImportSchemaAdapter {
  validate(row: ImportRow): AsyncResult<ImportValidationOutcome, AppError>;
}

export interface ImportParser {
  parse(buffer: Buffer): AsyncResult<readonly ParsedImportRow[], AppError>;
}

export type ImportParserRegistry = Partial<Record<ImportFormat, ImportParser>>;

export interface ImportQueuePort {
  enqueue(job: ImportJob): AsyncResult<void, AppError>;
}

export interface ImportQueueLike {
  add(name: string, data: ImportJob, options: ImportQueueOptions): Promise<unknown>;
}

export interface ImportQueueOptions {
  attempts: number;
  backoff: { type: 'exponential'; delay: number };
  removeOnComplete: boolean;
  removeOnFail: boolean;
}

export interface ImportRequestHandlerDeps {
  queue: ImportQueuePort;
}

export interface ImportStoragePort {
  read(fileKey: string): AsyncResult<Buffer, AppError>;
}

export interface ImportEventPublisher {
  publish(eventName: string, payload: unknown): AsyncResult<void, AppError>;
}

export interface ImportErrorReportRequest {
  exportId: string;
  requestedBy: string;
  moduleId: string;
  format: 'spreadsheet';
  templateId: string;
  locale: string;
  payload: {
    titleKey: string;
    columns: ReadonlyArray<{ key: string; labelKey: string }>;
    rows: readonly ImportRow[];
  };
}

export interface ImportDocumentReportRequester {
  requestErrorReport(request: ImportErrorReportRequest): AsyncResult<ImportErrorReport, AppError>;
}

export interface ImportProcessorDeps {
  parsers: ImportParserRegistry;
  storage: ImportStoragePort;
  schema: ImportSchemaAdapter;
  events: ImportEventPublisher;
  documents: ImportDocumentReportRequester;
}

export interface ProcessedImportBatches {
  batches: readonly ImportBatchReady[];
  summary: ImportProcessSummary;
}
