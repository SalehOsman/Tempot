import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import { err, ok } from 'neverthrow';
import { DOCUMENT_ENGINE_ERRORS } from '../document-engine.errors.js';
import { documentEngineToggle } from '../document-engine.toggle.js';
import type { DocumentGenerationInput, GeneratedDocument } from '../document-engine.types.js';
import type { DocumentGenerator } from '../document-engine.ports.js';
import { createSpreadsheetXmlFiles } from './spreadsheet-xml.writer.js';
import { createStoredZip } from './spreadsheet-zip.writer.js';

const SPREADSHEET_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export class SpreadsheetDocumentGenerator implements DocumentGenerator {
  async generate(input: DocumentGenerationInput): AsyncResult<GeneratedDocument> {
    const disabled = documentEngineToggle.check();
    if (disabled) return disabled;

    try {
      return ok({
        exportId: input.request.exportId,
        buffer: createStoredZip(createSpreadsheetXmlFiles(input)),
        contentType: SPREADSHEET_CONTENT_TYPE,
        fileName: `${input.request.exportId}.xlsx`,
        labelKeys: input.template.labelKeys,
        layoutDirection: input.template.layoutDirection,
      });
    } catch (error) {
      return err(new AppError(DOCUMENT_ENGINE_ERRORS.GENERATION_FAILED, error));
    }
  }
}
