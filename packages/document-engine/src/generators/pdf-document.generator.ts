import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import { err, ok } from 'neverthrow';
import { DOCUMENT_ENGINE_ERRORS } from '../document-engine.errors.js';
import { documentEngineToggle } from '../document-engine.toggle.js';
import type {
  DocumentGenerationInput,
  DocumentRow,
  GeneratedDocument,
} from '../document-engine.types.js';
import type { DocumentGenerator } from '../document-engine.ports.js';

export class PdfDocumentGenerator implements DocumentGenerator {
  async generate(input: DocumentGenerationInput): AsyncResult<GeneratedDocument> {
    const disabled = documentEngineToggle.check();
    if (disabled) return disabled;

    try {
      return ok({
        exportId: input.request.exportId,
        buffer: createPdfBuffer(input),
        contentType: 'application/pdf',
        fileName: `${input.request.exportId}.pdf`,
        labelKeys: input.template.labelKeys,
        layoutDirection: input.template.layoutDirection,
      });
    } catch (error) {
      return err(new AppError(DOCUMENT_ENGINE_ERRORS.GENERATION_FAILED, error));
    }
  }
}

function createPdfBuffer(input: DocumentGenerationInput): Buffer {
  const lines = [
    input.request.payload.titleKey,
    `locale:${input.request.locale}`,
    `layout:${input.template.layoutDirection}`,
    `layoutKey:document_engine.layout.${input.template.layoutDirection}`,
    input.template.fields.map((field) => field.labelKey).join(' | '),
    ...input.request.payload.rows.map((row) => serializeRow(row)),
  ];
  const stream = `BT /F1 12 Tf 72 720 Td (${escapePdfText(lines.join('\\n'))}) Tj ET`;
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    `5 0 obj << /Length ${Buffer.byteLength(stream)} >> stream\n${stream}\nendstream endobj`,
    `6 0 obj << /Lang (${escapePdfText(input.request.locale)}) /Subject (document_engine.layout.${input.template.layoutDirection}) >> endobj`,
  ];
  return Buffer.from(writePdf(objects), 'latin1');
}

function writePdf(objects: readonly string[]): string {
  let body = '%PDF-1.4\n';
  const offsets = [0];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(body, 'latin1'));
    body += `${object}\n`;
  }
  const xrefOffset = Buffer.byteLength(body, 'latin1');
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  body += offsets
    .slice(1)
    .map((offset) => `${offset.toString().padStart(10, '0')} 00000 n \n`)
    .join('');
  body += `trailer << /Size ${objects.length + 1} /Root 1 0 R /Info 6 0 R >>\n`;
  body += `startxref\n${xrefOffset}\n%%EOF\n`;
  return body;
}

function serializeRow(row: DocumentRow): string {
  return Object.entries(row)
    .map(([key, value]) => `${key}:${String(value)}`)
    .join(' | ');
}

function escapePdfText(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)');
}
