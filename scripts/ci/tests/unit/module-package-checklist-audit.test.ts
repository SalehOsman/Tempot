import { describe, expect, it } from 'vitest';

import { auditModulePackageChecklist } from '../../module-package-checklist-audit.js';

describe('module package checklist audit', () => {
  it('should report missing module package checklist artifacts', () => {
    const report = auditModulePackageChecklist([
      {
        moduleName: 'user-management',
        files: new Set(['package.json', 'index.ts']),
        packageJson: {
          name: '@tempot/user-management',
          main: 'dist/index.js',
        },
      },
    ]);

    expect(report.violations.map((violation) => violation.code)).toEqual([
      'MISSING_TYPES',
      'MISSING_EXPORTS',
      'MISSING_VITEST_CONFIG',
      'MISSING_GITIGNORE',
    ]);
  });

  it('should pass a module with package metadata and local governance files', () => {
    const report = auditModulePackageChecklist([
      {
        moduleName: 'user-management',
        files: new Set(['package.json', 'index.ts', 'vitest.config.ts', '.gitignore']),
        packageJson: {
          name: '@tempot/user-management',
          main: 'dist/index.js',
          types: 'dist/index.d.ts',
          exports: {
            '.': {
              types: './dist/index.d.ts',
              import: './dist/index.js',
            },
          },
        },
      },
    ]);

    expect(report.violations).toHaveLength(0);
  });
});
