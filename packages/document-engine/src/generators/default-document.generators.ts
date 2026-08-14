import type { DocumentGeneratorRegistry } from '../document-engine.ports.js';
import { PdfDocumentGenerator } from './pdf-document.generator.js';
import { SpreadsheetDocumentGenerator } from './spreadsheet-document.generator.js';

export function createDefaultDocumentGenerators(): DocumentGeneratorRegistry {
  return {
    pdf: new PdfDocumentGenerator(),
    spreadsheet: new SpreadsheetDocumentGenerator(),
  };
}
