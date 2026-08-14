import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import { err, ok } from 'neverthrow';
import { DOCUMENT_ENGINE_ERRORS } from './document-engine.errors.js';
import { documentEngineToggle } from './document-engine.toggle.js';
import type {
  DocumentExportQueueLike,
  DocumentExportQueueOptions,
  DocumentQueuePort,
} from './document-engine.ports.js';
import type { DocumentExportJob } from './document-engine.types.js';

const QUEUE_NAME = 'document.export';
const ATTEMPTS = 3;
const BACKOFF_DELAY_MS = 1000;

export class DocumentExportQueue implements DocumentQueuePort {
  constructor(private readonly queue: DocumentExportQueueLike) {}

  async enqueue(job: DocumentExportJob): AsyncResult<void> {
    const disabled = documentEngineToggle.check();
    if (disabled) return disabled;

    try {
      await this.queue.add(QUEUE_NAME, job, this.toQueueOptions());
      return ok(undefined);
    } catch (error) {
      return err(new AppError(DOCUMENT_ENGINE_ERRORS.QUEUE_ENQUEUE_FAILED, error));
    }
  }

  private toQueueOptions(): DocumentExportQueueOptions {
    return {
      attempts: ATTEMPTS,
      backoff: { type: 'exponential', delay: BACKOFF_DELAY_MS },
      removeOnComplete: true,
      removeOnFail: false,
    };
  }
}
