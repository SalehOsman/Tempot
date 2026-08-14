import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import { err, ok } from 'neverthrow';
import { IMPORT_ENGINE_ERRORS } from './import-engine.errors.js';
import { importEngineToggle } from './import-engine.toggle.js';
import type {
  ImportQueueLike,
  ImportQueueOptions,
  ImportQueuePort,
} from './import-engine.ports.js';
import type { ImportJob } from './import-engine.types.js';

const QUEUE_NAME = 'import.process';
const ATTEMPTS = 3;
const BACKOFF_DELAY_MS = 1000;

export class ImportQueue implements ImportQueuePort {
  constructor(private readonly queue: ImportQueueLike) {}

  async enqueue(job: ImportJob): AsyncResult<void> {
    const disabled = importEngineToggle.check();
    if (disabled) return disabled;

    try {
      await this.queue.add(QUEUE_NAME, job, this.toQueueOptions());
      return ok(undefined);
    } catch (error) {
      return err(new AppError(IMPORT_ENGINE_ERRORS.QUEUE_ENQUEUE_FAILED, error));
    }
  }

  private toQueueOptions(): ImportQueueOptions {
    return {
      attempts: ATTEMPTS,
      backoff: { type: 'exponential', delay: BACKOFF_DELAY_MS },
      removeOnComplete: true,
      removeOnFail: false,
    };
  }
}
