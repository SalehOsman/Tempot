import { defineConfig } from 'vitest/config';

/**
 * Constitution Rule XXXVI — Coverage Threshold Tiers:
 *   Services:       80% (build fails)
 *   Handlers:       70% (build fails)
 *   Repositories:   60% (warning)
 *   Conversations:  50% (warning)
 */

/** Base coverage thresholds (handler tier — 70%). */
export const baseCoverageThresholds = {
  lines: 70,
  functions: 70,
  branches: 70,
  statements: 70,
} as const;

/** Service-level coverage thresholds (80%). */
export const serviceCoverageThresholds = {
  lines: 80,
  functions: 80,
  branches: 80,
  statements: 80,
} as const;

/** Shared coverage configuration with base thresholds. */
export const baseCoverage = {
  provider: 'v8' as const,
  reporter: ['text', 'lcov', 'html'],
  thresholds: baseCoverageThresholds,
};

/** Shared test exclude patterns. */
export const baseExclude = [
  '**/node_modules/**',
  '**/dist/**',
  '.worktrees/**',
  '**/.worktrees/**',
  '**/*.test.js',
  '**/*.test.d.ts',
];

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    exclude: baseExclude,
    coverage: baseCoverage,
  },
});
