import type { ImportBatchReady, ImportRow } from './import-engine.types.js';

export interface CreateImportBatchesInput {
  importId: string;
  moduleId: string;
  batchSize: number;
  rows: readonly ImportRow[];
}

export function createImportBatches(input: CreateImportBatchesInput): readonly ImportBatchReady[] {
  const batches: ImportBatchReady[] = [];
  for (let index = 0; index < input.rows.length; index += input.batchSize) {
    batches.push({
      importId: input.importId,
      moduleId: input.moduleId,
      batchNumber: batches.length + 1,
      rows: input.rows.slice(index, index + input.batchSize),
    });
  }
  return batches;
}
