import { defineConfig, defineProject } from 'vitest/config';
import { baseExclude } from './vitest.config.base';

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 120_000,
    hookTimeout: 120_000,
    projects: [
      defineProject({
        test: {
          name: 'unit',
          include: [
            'packages/*/tests/unit/**/*.test.ts',
            'modules/*/tests/unit/**/*.test.ts',
            'scripts/*/tests/unit/**/*.test.ts',
          ],
          exclude: baseExclude,
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
          exclude: baseExclude,
          environment: 'node',
          fileParallelism: false,
          testTimeout: 120_000,
          hookTimeout: 120_000,
        },
      }),
    ],
  },
});
