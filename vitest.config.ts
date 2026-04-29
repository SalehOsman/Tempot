import { defineConfig, defineProject } from 'vitest/config';
import { baseExclude } from './vitest.config.base';

const testTimeout = 120_000;

export default defineConfig({
  test: {
    globals: true,
    testTimeout,
    hookTimeout: testTimeout,
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
          testTimeout,
          hookTimeout: testTimeout,
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
          testTimeout,
          hookTimeout: testTimeout,
        },
      }),
    ],
  },
});
