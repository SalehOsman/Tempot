import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  {
    extends: './vitest.config.base.ts',
    test: {
      name: 'unit',
      include: ['packages/*/tests/unit/**/*.test.ts', 'modules/*/tests/unit/**/*.test.ts'],
    },
  },
  {
    extends: './vitest.config.base.ts',
    test: {
      name: 'integration',
      include: [
        'packages/*/tests/integration/**/*.test.ts',
        'modules/*/tests/integration/**/*.test.ts',
      ],
      testTimeout: 30000,
    },
  },
]);
