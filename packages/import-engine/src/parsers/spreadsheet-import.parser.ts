import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import { err, ok } from 'neverthrow';
import { IMPORT_ENGINE_ERRORS } from '../import-engine.errors.js';
import { importEngineToggle } from '../import-engine.toggle.js';
import type { ImportRow, ParsedImportRow } from '../import-engine.types.js';
import { readStoredZip } from './spreadsheet-zip.reader.js';

const WORKSHEET_PATH = 'xl/worksheets/sheet1.xml';

export class SpreadsheetImportParser {
  async parse(buffer: Buffer): AsyncResult<readonly ParsedImportRow[]> {
    const disabled = importEngineToggle.check();
    if (disabled) return disabled;

    try {
      const worksheet = readStoredZip(buffer).find((entry) => entry.path === WORKSHEET_PATH);
      if (!worksheet) return err(new AppError(IMPORT_ENGINE_ERRORS.PARSE_FAILED));
      return ok(parseWorksheet(worksheet.content.toString('utf8')));
    } catch (error) {
      return err(new AppError(IMPORT_ENGINE_ERRORS.PARSE_FAILED, error));
    }
  }
}

function parseWorksheet(xml: string): readonly ParsedImportRow[] {
  const rows = [...xml.matchAll(/<row[^>]*r="(?<rowNumber>\d+)"[^>]*>(?<content>.*?)<\/row>/gs)]
    .map((match) => ({
      rowNumber: Number(match.groups?.rowNumber ?? 0),
      values: parseCells(match.groups?.content ?? ''),
    }))
    .filter((row) => row.values.length > 0);
  const [headers, ...records] = rows;
  if (!headers) return [];
  return records.map((record) => ({
    rowNumber: record.rowNumber,
    data: toImportRow(headers.values, record.values),
  }));
}

function parseCells(rowContent: string): readonly string[] {
  return [
    ...rowContent.matchAll(/<c[^>]*r="(?<ref>[A-Z]+\d+)"[^>]*>.*?<t>(?<value>.*?)<\/t>.*?<\/c>/gs),
  ]
    .sort(
      (left, right) => columnIndex(left.groups?.ref ?? '') - columnIndex(right.groups?.ref ?? ''),
    )
    .map((match) => unescapeXml(match.groups?.value ?? ''));
}

function columnIndex(reference: string): number {
  const letters = reference.replace(/\d/g, '');
  return [...letters].reduce((total, letter) => total * 26 + letter.charCodeAt(0) - 64, 0);
}

function toImportRow(headers: readonly string[], record: readonly string[]): ImportRow {
  return Object.fromEntries(headers.map((header, index) => [header, record[index] ?? '']));
}

function unescapeXml(value: string): string {
  return value
    .replaceAll('&apos;', "'")
    .replaceAll('&quot;', '"')
    .replaceAll('&gt;', '>')
    .replaceAll('&lt;', '<')
    .replaceAll('&amp;', '&');
}
