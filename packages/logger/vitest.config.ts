import { defineConfig, defineProject } from 'vitest/config';
import { serviceCoverageThresholds } from '../../vitest.config.base';

export default defineConfig({
  test: {
    projects: [
      defineProject({
        test: {
          name: 'unit',
          include: ['tests/unit/**/*.test.ts'],
          environment: 'node',
        },
      }),
      defineProject({
        test: {
          name: 'integration',
          include: ['tests/integration/**/*.test.ts'],
          environment: 'node',
          testTimeout: 120_000,
          hookTimeout: 120_000,
        },
      }),
    ],
    coverage: {
      provider: 'v8',
      thresholds: serviceCoverageThresholds,
    },
  },
});
