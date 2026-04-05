import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { FreshnessReport } from '../../scripts/docs.types.js';

vi.mock('node:child_process');

describe('checkFreshness', () => {
  let checkFreshness: typeof import('../../scripts/check-freshness.js').checkFreshness;
  let execSync: typeof import('node:child_process').execSync;

  beforeEach(async () => {
    vi.resetModules();

    const childProcess = await import('node:child_process');
    execSync = childProcess.execSync;

    const mod = await import('../../scripts/check-freshness.js');
    checkFreshness = mod.checkFreshness;
  });

  it('reports stale when source file is newer than doc file', () => {
    const sourceTimestamp = '2026-04-06T12:00:00+00:00';
    const docTimestamp = '2026-04-01T12:00:00+00:00';

    vi.mocked(execSync).mockImplementation((cmd: string) => {
      const command = String(cmd);
      if (command.includes('git ls-files')) {
        return 'docs/product/en/guides/shared-overview.md\n';
      }
      if (command.includes('packages/shared/src')) return sourceTimestamp;
      if (command.includes('docs/product/')) return docTimestamp;
      return '';
    });

    const reports = checkFreshness(['shared']);
    expect(reports.length).toBeGreaterThan(0);

    const staleReport = reports.find((r: FreshnessReport) => r.isStale);
    expect(staleReport).toBeDefined();
    expect(staleReport!.package).toBe('shared');
    expect(staleReport!.sourceMtime).toBe(sourceTimestamp);
    expect(staleReport!.docMtime).toBe(docTimestamp);
  });

  it('reports not stale when doc is up to date', () => {
    const sourceTimestamp = '2026-04-01T12:00:00+00:00';
    const docTimestamp = '2026-04-06T12:00:00+00:00';

    vi.mocked(execSync).mockImplementation((cmd: string) => {
      const command = String(cmd);
      if (command.includes('git ls-files')) {
        return 'docs/product/en/guides/logger-usage.md\n';
      }
      if (command.includes('packages/logger/src')) return sourceTimestamp;
      if (command.includes('docs/product/')) return docTimestamp;
      return '';
    });

    const reports = checkFreshness(['logger']);
    expect(reports.length).toBeGreaterThan(0);
    expect(reports[0].isStale).toBe(false);
    expect(reports[0].package).toBe('logger');
  });

  it('returns no stale reports when all docs are fresh', () => {
    const sourceTimestamp = '2026-04-01T12:00:00+00:00';
    const docTimestamp = '2026-04-06T12:00:00+00:00';

    vi.mocked(execSync).mockImplementation((cmd: string) => {
      const command = String(cmd);
      if (command.includes('git ls-files') && command.includes('shared')) {
        return 'docs/product/en/guides/shared-overview.md\n';
      }
      if (command.includes('git ls-files') && command.includes('logger')) {
        return 'docs/product/en/guides/logger-usage.md\n';
      }
      if (command.includes('docs/product/')) return docTimestamp;
      return sourceTimestamp;
    });

    const reports = checkFreshness(['shared', 'logger']);
    const staleReports = reports.filter((r: FreshnessReport) => r.isStale);
    expect(staleReports).toHaveLength(0);
  });

  it('outputs structured FreshnessReport with all required fields', () => {
    const sourceTimestamp = '2026-04-06T10:00:00+00:00';
    const docTimestamp = '2026-04-05T10:00:00+00:00';

    vi.mocked(execSync).mockImplementation((cmd: string) => {
      const command = String(cmd);
      if (command.includes('git ls-files')) {
        return 'docs/product/en/concepts/ai-core-overview.md\n';
      }
      if (command.includes('packages/ai-core/src')) return sourceTimestamp;
      if (command.includes('docs/product/')) return docTimestamp;
      return '';
    });

    const reports = checkFreshness(['ai-core']);
    expect(reports).toHaveLength(1);

    const report = reports[0];
    expect(report).toStrictEqual({
      package: 'ai-core',
      sourceFile: 'packages/ai-core/src/',
      docFile: 'docs/product/en/concepts/ai-core-overview.md',
      sourceMtime: sourceTimestamp,
      docMtime: docTimestamp,
      isStale: true,
    } satisfies FreshnessReport);
  });

  it('handles packages without documentation files gracefully', () => {
    vi.mocked(execSync).mockImplementation((cmd: string) => {
      const command = String(cmd);
      if (command.includes('git ls-files')) {
        return '';
      }
      return '';
    });

    const reports = checkFreshness(['cms-engine']);
    expect(reports).toHaveLength(0);
  });

  it('handles packages with multiple doc files', () => {
    const sourceTimestamp = '2026-04-06T12:00:00+00:00';
    const docTimestamp1 = '2026-04-07T12:00:00+00:00';
    const docTimestamp2 = '2026-04-01T12:00:00+00:00';

    vi.mocked(execSync).mockImplementation((cmd: string) => {
      const command = String(cmd);
      if (command.includes('git ls-files')) {
        return 'docs/product/en/guides/shared-overview.md\ndocs/product/ar/guides/shared-overview.md\n';
      }
      if (command.includes('packages/shared/src')) return sourceTimestamp;
      if (command.includes('en/guides/shared')) return docTimestamp1;
      if (command.includes('ar/guides/shared')) return docTimestamp2;
      return '';
    });

    const reports = checkFreshness(['shared']);
    expect(reports).toHaveLength(2);

    const freshReport = reports.find((r: FreshnessReport) => !r.isStale);
    const staleReport = reports.find((r: FreshnessReport) => r.isStale);
    expect(freshReport).toBeDefined();
    expect(staleReport).toBeDefined();
  });

  it('skips entries when git log returns empty for untracked files', () => {
    vi.mocked(execSync).mockImplementation((cmd: string) => {
      const command = String(cmd);
      if (command.includes('git ls-files')) {
        return 'docs/product/en/guides/shared-overview.md\n';
      }
      // git log returns empty for untracked files
      return '';
    });

    const reports = checkFreshness(['shared']);
    expect(reports).toHaveLength(0);
  });
});
