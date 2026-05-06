import type { AppError, AsyncResult } from '@tempot/shared';
import type {
  DocumentExportFormat,
  DocumentExportJob,
  DocumentExportResult,
  DocumentGenerationInput,
  GeneratedDocument,
} from './document-engine.types.js';

export interface DocumentGenerator {
  generate(input: DocumentGenerationInput): AsyncResult<GeneratedDocument, AppError>;
}

export type DocumentGeneratorRegistry = Partial<Record<DocumentExportFormat, DocumentGenerator>>;

export interface DocumentQueuePort {
  enqueue(job: DocumentExportJob): AsyncResult<void, AppError>;
}

export interface DocumentEventPublisher {
  publish(eventName: string, payload: unknown): AsyncResult<void, AppError>;
}

export interface DocumentStorageUploadInput {
  key: string;
  contentType: string;
  buffer: Buffer;
}

export interface DocumentStorageUploadResult {
  storageKey: string;
  downloadUrl?: string;
  sizeBytes: number;
}

export interface DocumentStoragePort {
  upload(input: DocumentStorageUploadInput): AsyncResult<DocumentStorageUploadResult, AppError>;
}

export interface DocumentExportRequestHandlerDeps {
  queue: DocumentQueuePort;
}

export interface DocumentExportProcessorDeps {
  generators: DocumentGeneratorRegistry;
  storage: DocumentStoragePort;
  events: DocumentEventPublisher;
}

export interface DocumentExportQueueLike {
  add(name: string, data: DocumentExportJob, options: DocumentExportQueueOptions): Promise<unknown>;
}

export interface DocumentExportQueueOptions {
  attempts: number;
  backoff: { type: 'exponential'; delay: number };
  removeOnComplete: boolean;
  removeOnFail: boolean;
}

export interface CompletionEventPayload extends DocumentExportResult {
  requestedBy: string;
  moduleId: string;
}
