export type DocumentExportFormat = 'pdf' | 'spreadsheet';
export type DocumentLayoutDirection = 'ltr' | 'rtl';
export type DocumentCellValue = string | number | boolean | null;
export type DocumentRow = Readonly<Record<string, DocumentCellValue>>;

export interface DocumentField {
  key: string;
  labelKey: string;
}

export interface DocumentExportPayload {
  titleKey: string;
  columns: readonly DocumentField[];
  rows: readonly DocumentRow[];
}

export interface DocumentExportRequest {
  exportId: string;
  requestedBy: string;
  moduleId: string;
  format: DocumentExportFormat;
  templateId: string;
  locale: string;
  payload: DocumentExportPayload;
}

export interface DocumentExportJob {
  exportId: string;
  request: DocumentExportRequest;
  attempt: number;
}

export interface QueuedDocumentExport extends DocumentExportJob {
  queueName?: string;
}

export interface DocumentTemplate {
  templateId: string;
  format: DocumentExportFormat;
  labelKeys: readonly string[];
  layoutDirection: DocumentLayoutDirection;
  fields: readonly DocumentField[];
}

export interface GeneratedDocument {
  exportId: string;
  buffer: Buffer;
  contentType: string;
  fileName: string;
  labelKeys: readonly string[];
  layoutDirection: DocumentLayoutDirection;
}

export interface DocumentExportResult {
  exportId: string;
  storageKey: string;
  downloadUrl?: string;
  contentType: string;
  sizeBytes: number;
}

export interface DocumentExportFailure {
  exportId: string;
  errorCode: string;
  messageKey: string;
  retryable: boolean;
}

export interface DocumentGenerationInput {
  request: DocumentExportRequest;
  template: DocumentTemplate;
}

export function createDocumentExportJob(
  request: DocumentExportRequest,
  attempt = 1,
): DocumentExportJob {
  return {
    exportId: request.exportId,
    request,
    attempt,
  };
}
