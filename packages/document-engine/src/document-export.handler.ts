import type { AsyncResult } from '@tempot/shared';
import { documentEngineToggle } from './document-engine.toggle.js';
import { createDocumentExportJob } from './document-engine.types.js';
import type { DocumentExportRequestHandlerDeps } from './document-engine.ports.js';
import type { DocumentExportRequest } from './document-engine.types.js';

export class DocumentExportRequestHandler {
  constructor(private readonly deps: DocumentExportRequestHandlerDeps) {}

  async handle(request: DocumentExportRequest): AsyncResult<void> {
    const disabled = documentEngineToggle.check();
    if (disabled) return disabled;

    return this.deps.queue.enqueue(createDocumentExportJob(request));
  }
}
