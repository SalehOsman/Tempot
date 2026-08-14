import type { AsyncResult } from '@tempot/shared';
import type { ImportRequestHandlerDeps } from './import-engine.ports.js';
import { importEngineToggle } from './import-engine.toggle.js';
import { createImportJob } from './import-engine.types.js';
import type { ImportRequest } from './import-engine.types.js';

export class ImportRequestHandler {
  constructor(private readonly deps: ImportRequestHandlerDeps) {}

  async handle(request: ImportRequest): AsyncResult<void> {
    const disabled = importEngineToggle.check();
    if (disabled) return disabled;

    return this.deps.queue.enqueue(createImportJob(request));
  }
}
