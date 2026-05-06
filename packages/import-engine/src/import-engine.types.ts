export type ImportFormat = 'csv' | 'spreadsheet';
export type ImportCellValue = string | number | boolean | null;
export type ImportRow = Readonly<Record<string, ImportCellValue>>;
export type ImportRowStatus = 'valid' | 'invalid';
export type ImportProcessStatus = 'completed' | 'completed-with-errors' | 'failed';

export interface ImportRequest {
  importId: string;
  requestedBy: string;
  moduleId: string;
  fileKey: string;
  format: ImportFormat;
  locale: string;
  batchSize: number;
  schemaKey: string;
}

export interface ImportJob {
  importId: string;
  request: ImportRequest;
  attempt: number;
}

export interface QueuedImportJob extends ImportJob {
  queueName?: string;
}

export interface ParsedImportRow {
  rowNumber: number;
  data: ImportRow;
}

export interface ImportValidationIssue {
  fieldKey: string;
  messageKey: string;
}

export interface ImportRowResult {
  rowNumber: number;
  status: ImportRowStatus;
  data?: ImportRow;
  errors?: readonly ImportValidationIssue[];
}

export interface ImportBatchReady {
  importId: string;
  moduleId: string;
  batchNumber: number;
  rows: readonly ImportRow[];
}

export interface ImportErrorReport {
  exportId: string;
}

export interface ImportProcessSummary {
  importId: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  status: ImportProcessStatus;
  errorReport?: ImportErrorReport;
}

export interface ImportFailure {
  importId: string;
  errorCode: string;
  messageKey: string;
  retryable: boolean;
}

export function createImportJob(request: ImportRequest, attempt = 1): ImportJob {
  return {
    importId: request.importId,
    request,
    attempt,
  };
}
