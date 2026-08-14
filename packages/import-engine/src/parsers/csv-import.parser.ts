import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import { err, ok } from 'neverthrow';
import { IMPORT_ENGINE_ERRORS } from '../import-engine.errors.js';
import { importEngineToggle } from '../import-engine.toggle.js';
import type { ImportRow, ParsedImportRow } from '../import-engine.types.js';

export class CsvImportParser {
  async parse(buffer: Buffer): AsyncResult<readonly ParsedImportRow[]> {
    const disabled = importEngineToggle.check();
    if (disabled) return disabled;

    try {
      const table = parseCsv(buffer.toString('utf8'));
      const [headers, ...records] = table;
      if (!headers || headers.length === 0) return ok([]);
      return ok(
        records
          .filter((record) => record.some((cell) => cell.length > 0))
          .map((record, index) => ({
            rowNumber: index + 2,
            data: toImportRow(headers, record),
          })),
      );
    } catch (error) {
      return err(new AppError(IMPORT_ENGINE_ERRORS.PARSE_FAILED, error));
    }
  }
}

function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const next = content[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(cell);
      cell = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else if (char !== undefined) {
      cell += char;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function toImportRow(headers: readonly string[], record: readonly string[]): ImportRow {
  return Object.fromEntries(
    headers.map((header, index) => [header.trim(), record[index]?.trim() ?? '']),
  );
}
