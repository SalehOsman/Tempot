import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const CI_WORKFLOW_PATH = join(process.cwd(), '.github', 'workflows', 'ci.yml');

describe('CI workflow quality gates', () => {
  it('should run Tempot CLI smoke checks in methodology gates', () => {
    const workflow = readFileSync(CI_WORKFLOW_PATH, 'utf8');

    expect(workflow).toContain('pnpm tempot init');
    expect(workflow).toContain('pnpm tempot doctor --quick');
  });

  it('should run architecture governance checks in methodology gates', () => {
    const workflow = readFileSync(CI_WORKFLOW_PATH, 'utf8');

    expect(workflow).toContain('pnpm boundary:audit');
    expect(workflow).toContain('pnpm module:checklist');
  });

  it('should build on the minimum and current supported Node runtimes', () => {
    const workflow = readFileSync(CI_WORKFLOW_PATH, 'utf8');
    const typecheckJob = workflow.slice(
      workflow.indexOf('  typecheck:'),
      workflow.indexOf('  test-unit:'),
    );

    expect(typecheckJob).toContain("node: ['22.12.0', '24']");
    expect(typecheckJob).toContain('node-version: ${{ matrix.node }}');
    expect(typecheckJob).toContain('pnpm build');
  });

  it('should build the full workspace before running root unit tests', () => {
    const workflow = readFileSync(CI_WORKFLOW_PATH, 'utf8');
    const unitJob = workflow.slice(
      workflow.indexOf('  test-unit:'),
      workflow.indexOf('  test-integration:'),
    );
    const unitJobLines = unitJob.split(/\r?\n/u).map((line) => line.trim());

    expect(unitJobLines).toContain('- run: pnpm build');
    expect(unitJobLines.indexOf('- run: pnpm build')).toBeLessThan(
      unitJobLines.indexOf('- run: pnpm test:unit'),
    );
  });

  it('should initialize the database before running coverage tests', () => {
    const workflow = readFileSync(CI_WORKFLOW_PATH, 'utf8');
    const coverageJob = workflow.slice(
      workflow.indexOf('  coverage:'),
      workflow.indexOf('  audit:'),
    );

    expect(coverageJob).toContain(
      'pnpm --filter @tempot/database exec prisma db push --accept-data-loss',
    );
    expect(coverageJob.indexOf('prisma db push')).toBeLessThan(
      coverageJob.indexOf('pnpm test:coverage'),
    );
  });
});
