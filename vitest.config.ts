import { defineConfig, defineProject } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    projects: [
      defineProject({
        test: {
          name: 'unit',
          include: ['packages/*/tests/unit/**/*.test.ts', 'modules/*/tests/unit/**/*.test.ts'],
          exclude: ['**/node_modules/**', '**/dist/**', '.worktrees/**'],
          environment: 'node',
        },
      }),
      defineProject({
        test: {
          name: 'integration',
          include: [
            'packages/*/tests/integration/**/*.test.ts',
            'modules/*/tests/integration/**/*.test.ts',
          ],
          exclude: ['**/node_modules/**', '**/dist/**', '.worktrees/**'],
          environment: 'node',
          testTimeout: 30000,
        },
      }),
    ],
  },
});
