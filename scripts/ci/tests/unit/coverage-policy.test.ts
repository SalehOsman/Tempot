import { describe, expect, it } from 'vitest';
import { evaluateCoveragePolicy } from '../../coverage-policy.js';

function metrics(lines: number) {
  return {
    lines: { total: 100, covered: lines, skipped: 0, pct: lines },
    functions: { total: 10, covered: 10, skipped: 0, pct: 100 },
    statements: { total: 100, covered: lines, skipped: 0, pct: lines },
    branches: { total: 10, covered: 10, skipped: 0, pct: 100 },
  };
}

describe('evaluateCoveragePolicy', () => {
  it('blocks services and handlers below their constitutional thresholds', () => {
    const report = evaluateCoveragePolicy({
      total: metrics(90),
      'F:/repo/apps/api/src/user.service.ts': metrics(79),
      'F:/repo/modules/users/src/list.handler.ts': metrics(69),
    });

    expect(report.failures).toEqual([
      expect.objectContaining({ category: 'service', threshold: 80, actual: 79 }),
      expect.objectContaining({ category: 'handler', threshold: 70, actual: 69 }),
    ]);
  });

  it('reports repository and conversation gaps as warnings', () => {
    const report = evaluateCoveragePolicy({
      total: metrics(90),
      'F:/repo/packages/database/src/user.repository.ts': metrics(59),
      'F:/repo/modules/users/src/profile.conversation.ts': metrics(49),
    });

    expect(report.failures).toEqual([]);
    expect(report.warnings).toEqual([
      expect.objectContaining({ category: 'repository', threshold: 60, actual: 59 }),
      expect.objectContaining({ category: 'conversation', threshold: 50, actual: 49 }),
    ]);
  });

  it('includes application source in component classification', () => {
    const report = evaluateCoveragePolicy({
      total: metrics(90),
      'F:/repo/apps/bot-server/src/startup/cache.service.ts': metrics(75),
    });

    expect(report.evaluatedFiles).toContain('F:/repo/apps/bot-server/src/startup/cache.service.ts');
    expect(report.failures).toHaveLength(1);
  });
});
