import { defineConfig, defineProject } from 'vitest/config';
import { baseExclude } from './vitest.config.base';

const testTimeout = 120_000;

export default defineConfig({
  test: {
    globals: true,
    testTimeout,
    hookTimeout: testTimeout,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'lcov', 'html'],
      include: ['apps/*/src/**/*.ts', 'packages/*/src/**/*.ts', 'modules/*/src/**/*.ts'],
      exclude: [
        '**/*.d.ts',
        '**/*.config.ts',
        '**/index.ts',
        '**/generated/**',
        'packages/database/src/generated/**',
      ],
    },
    projects: [
      defineProject({
        test: {
          name: 'unit',
          include: [
            'apps/*/tests/unit/**/*.test.ts',
            'packages/*/tests/unit/**/*.test.ts',
            'modules/*/tests/unit/**/*.test.ts',
            'scripts/*/tests/unit/**/*.test.ts',
            'apps/*/tests/unit/**/*.test.ts',
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
            'apps/*/tests/integration/**/*.test.ts',
            'packages/*/tests/integration/**/*.test.ts',
            'modules/*/tests/integration/**/*.test.ts',
            'apps/*/tests/integration/**/*.test.ts',
          ],
          exclude: baseExclude,
          environment: 'node',
          fileParallelism: false,
          testTimeout,
          hookTimeout: testTimeout,
        },
      }),
      defineProject({
        test: {
          name: 'application',
          include: [
            'apps/*/tests/**/*.test.ts',
            'packages/*/tests/**/*.test.ts',
            'modules/*/tests/**/*.test.ts',
            'scripts/*/tests/**/*.test.ts',
          ],
          exclude: [
            ...baseExclude,
            '**/tests/unit/**',
            '**/tests/integration/**',
            '**/tests/e2e/**',
          ],
          environment: 'node',
          testTimeout,
          hookTimeout: testTimeout,
        },
      }),
      defineProject({
        test: {
          name: 'e2e',
          include: ['apps/*/tests/e2e/**/*.test.ts'],
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
