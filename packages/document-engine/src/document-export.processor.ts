import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import { err, ok } from 'neverthrow';
import { DOCUMENT_ENGINE_ERRORS } from './document-engine.errors.js';
import { DOCUMENT_ENGINE_EVENTS } from './document-engine.events.js';
import { documentEngineToggle } from './document-engine.toggle.js';
import type { DocumentExportProcessorDeps } from './document-engine.ports.js';
import type {
  DocumentExportFailure,
  DocumentExportJob,
  DocumentExportResult,
  DocumentTemplate,
} from './document-engine.types.js';

const FAILURE_MESSAGE_KEY = 'document_engine.export.failed';

export class DocumentExportProcessor {
  constructor(private readonly deps: DocumentExportProcessorDeps) {}

  async process(job: DocumentExportJob): AsyncResult<DocumentExportResult> {
    const disabled = documentEngineToggle.check();
    if (disabled) return disabled;

    const generator = this.deps.generators[job.request.format];
    if (!generator) {
      return this.fail(job, new AppError(DOCUMENT_ENGINE_ERRORS.UNSUPPORTED_FORMAT));
    }

    const generated = await generator.generate({
      request: job.request,
      template: this.toTemplate(job),
    });
    if (generated.isErr()) {
      return this.fail(job, generated.error);
    }

    const upload = await this.deps.storage.upload({
      key: `${job.request.moduleId}/${generated.value.fileName}`,
      contentType: generated.value.contentType,
      buffer: generated.value.buffer,
    });
    if (upload.isErr()) {
      return this.fail(job, upload.error);
    }

    const result: DocumentExportResult = {
      exportId: job.exportId,
      storageKey: upload.value.storageKey,
      downloadUrl: upload.value.downloadUrl,
      contentType: generated.value.contentType,
      sizeBytes: upload.value.sizeBytes,
    };
    const publish = await this.deps.events.publish(DOCUMENT_ENGINE_EVENTS.EXPORT_COMPLETED, {
      ...result,
      requestedBy: job.request.requestedBy,
      moduleId: job.request.moduleId,
    });
    if (publish.isErr()) {
      return err(new AppError(DOCUMENT_ENGINE_ERRORS.EVENT_PUBLISH_FAILED, publish.error));
    }
    return ok(result);
  }

  private async fail(job: DocumentExportJob, error: AppError): AsyncResult<DocumentExportResult> {
    const failure: DocumentExportFailure = {
      exportId: job.exportId,
      errorCode: error.code,
      messageKey: FAILURE_MESSAGE_KEY,
      retryable: true,
    };
    const publish = await this.deps.events.publish(DOCUMENT_ENGINE_EVENTS.EXPORT_FAILED, failure);
    if (publish.isErr()) {
      return err(
        new AppError(DOCUMENT_ENGINE_ERRORS.EVENT_PUBLISH_FAILED, {
          publishError: publish.error.code,
          originalError: error.code,
        }),
      );
    }
    return err(error);
  }

  private toTemplate(job: DocumentExportJob): DocumentTemplate {
    return {
      templateId: job.request.templateId,
      format: job.request.format,
      labelKeys: [
        job.request.payload.titleKey,
        ...job.request.payload.columns.map((column) => column.labelKey),
      ],
      layoutDirection: job.request.locale.startsWith('ar') ? 'rtl' : 'ltr',
      fields: job.request.payload.columns,
    };
  }
}
