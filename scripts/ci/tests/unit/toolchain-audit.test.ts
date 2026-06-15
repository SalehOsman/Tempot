import { describe, expect, it } from 'vitest';
import { auditToolchain } from '../../toolchain-audit.js';

const baseline = {
  manifest: JSON.stringify({
    packageManager: 'pnpm@10.33.3',
    engines: { node: '>=22.12.0' },
    devDependencies: { vitest: '4.1.0', '@vitest/coverage-v8': '4.1.0' },
  }),
  workflow: "PNPM_VERSION: '10.33.3'\nnode: ['22.12.0', '24']",
  dockerfile: 'FROM node:22.12-alpine AS base',
  roadmap: 'Node.js 22.12+\npnpm 10.33.3',
};

describe('auditToolchain', () => {
  it('accepts an aligned toolchain baseline', () => {
    expect(auditToolchain(baseline)).toEqual([]);
  });

  it('reports package-manager and coverage version drift', () => {
    const findings = auditToolchain({
      ...baseline,
      manifest: JSON.stringify({
        packageManager: 'pnpm@10.33.3',
        engines: { node: '>=22.12.0' },
        devDependencies: { vitest: '4.1.0', '@vitest/coverage-v8': '4.1.5' },
      }),
      workflow: "PNPM_VERSION: '10.32.1'\nnode: ['22.12.0', '24']",
    });

    expect(findings).toEqual([
      expect.objectContaining({ ruleId: 'toolchain.pnpm_mismatch' }),
      expect.objectContaining({ ruleId: 'toolchain.vitest_coverage_mismatch' }),
    ]);
  });

  it('rejects pnpm releases that require a newer Node runtime than the project minimum', () => {
    const findings = auditToolchain({
      ...baseline,
      manifest: baseline.manifest.replace('pnpm@10.33.3', 'pnpm@11.0.8'),
      workflow: baseline.workflow.replace("PNPM_VERSION: '10.33.3'", "PNPM_VERSION: '11.0.8'"),
      roadmap: baseline.roadmap.replace('pnpm 10.33.3', 'pnpm 11+'),
    });

    expect(findings).toContainEqual(expect.objectContaining({ ruleId: 'toolchain.pnpm_mismatch' }));
  });
});
