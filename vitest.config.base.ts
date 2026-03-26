import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '.worktrees/**',
      '**/.worktrees/**',
      '**/*.test.js',
      '**/*.test.d.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      // Constitution Rule XXXVI — Coverage Threshold Tiers:
      //   Services:       80% (build fails)
      //   Handlers:       70% (build fails)
      //   Repositories:   60% (warning)
      //   Conversations:  50% (warning)
      // Base config uses the lowest enforced tier (70%).
      // Individual packages may override with stricter thresholds.
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
});
