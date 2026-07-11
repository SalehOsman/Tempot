import { describe, expect, it } from 'vitest';
import { parseAuditArgs, runAudit } from '../../lib/audit-runner.js';

describe('audit runner', () => {
  it('parses common audit CLI arguments', () => {
    expect(parseAuditArgs(['--format=json', '--fixture-root', 'fixtures', '--quick'])).toEqual({
      format: 'json',
      fixtureRoot: 'fixtures',
      quick: true,
      silent: false,
    });
  });

  it('maps audit results to exit codes', async () => {
    const passed = await runAudit('sample', async () => []);
    const failed = await runAudit('sample', async () => [
      { rule: 'Rule XL', file: 'a.md', line: 1, column: 1, message: 'Violation.' },
    ]);

    expect(passed.exitCode).toBe(0);
    expect(failed.exitCode).toBe(1);
  });
});
