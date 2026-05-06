import type { AsyncResult } from '@tempot/shared';
import { err, ok } from 'neverthrow';
import type { ImportSchemaAdapter } from './import-engine.ports.js';
import { importEngineToggle } from './import-engine.toggle.js';
import type { ImportRowResult, ParsedImportRow } from './import-engine.types.js';

export class ImportValidator {
  constructor(private readonly schema: ImportSchemaAdapter) {}

  async validateRows(rows: readonly ParsedImportRow[]): AsyncResult<readonly ImportRowResult[]> {
    const disabled = importEngineToggle.check();
    if (disabled) return disabled;

    const results: ImportRowResult[] = [];
    for (const row of rows) {
      const validation = await this.schema.validate(row.data);
      if (validation.isErr()) return err(validation.error);
      if (validation.value.status === 'valid') {
        results.push({
          rowNumber: row.rowNumber,
          status: 'valid',
          data: validation.value.data,
        });
      } else {
        results.push({
          rowNumber: row.rowNumber,
          status: 'invalid',
          errors: validation.value.errors,
        });
      }
    }
    return ok(results);
  }
}
