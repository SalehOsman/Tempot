import { describe, it } from 'vitest';

describe('Import/Export Integration', () => {
  it.todo('exports template as valid JSON bundle');
  it.todo('imports JSON bundle and creates template in DRAFT');
  it.todo('round-trip export->import preserves all content');
  it.todo('import with unknown category resolves gracefully');
  it.todo('import with invalid bundle returns field-level errors');
  it.todo('rejects bundle exceeding 5MB size limit');
});
