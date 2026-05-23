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
    ],
    coverage: {
      provider: 'v8',
      thresholds: serviceCoverageThresholds,
    },
  },
});
