import { describe, expect, it } from 'vitest';

import { auditImportBoundaries } from '../../import-boundary-audit.js';

describe('tracked import boundary audit', () => {
  it('should reject module-to-module imports outside the owning module', () => {
    const report = auditImportBoundaries([
      {
        path: 'modules/user-management/services/user.service.ts',
        content: "import { config } from '../../person-registration/module.config.js';",
      },
    ]);

    expect(report.violations).toEqual([
      expect.objectContaining({
        code: 'MODULE_TO_MODULE_IMPORT',
        importer: 'modules/user-management/services/user.service.ts',
      }),
    ]);
  });

  it('should reject packages importing apps or modules', () => {
    const report = auditImportBoundaries([
      {
        path: 'packages/shared/src/index.ts',
        content: [
          "import { app } from '../../../apps/bot-server/src/index.js';",
          "import { userModule } from '../../../modules/user-management/index.js';",
        ].join('\n'),
      },
    ]);

    expect(report.violations.map((violation) => violation.code)).toEqual([
      'PACKAGE_TO_APP_IMPORT',
      'PACKAGE_TO_MODULE_IMPORT',
    ]);
  });

  it('should reject imports that target module package names', () => {
    const report = auditImportBoundaries([
      {
        path: 'modules/user-management/index.ts',
        content: '',
      },
      {
        path: 'packages/shared/src/index.ts',
        content: "import { moduleConfig } from '@tempot/user-management';",
      },
      {
        path: 'modules/person-registration/index.ts',
        content: "import { moduleConfig } from '@tempot/user-management';",
      },
    ]);

    expect(report.violations.map((violation) => violation.code)).toEqual([
      'PACKAGE_TO_MODULE_IMPORT',
      'MODULE_TO_MODULE_IMPORT',
    ]);
  });

  it('should reject deep package imports through @tempot package internals', () => {
    const report = auditImportBoundaries([
      {
        path: 'apps/bot-server/src/index.ts',
        content: "import { makeClient } from '@tempot/database/src/client.js';",
      },
    ]);

    expect(report.violations).toEqual([
      expect.objectContaining({
        code: 'DEEP_TEMPOT_PACKAGE_IMPORT',
        specifier: '@tempot/database/src/client.js',
      }),
    ]);
  });

  it('should allow public package imports and relative imports inside the same module', () => {
    const report = auditImportBoundaries([
      {
        path: 'modules/user-management/services/user.service.ts',
        content: [
          "import { ok } from 'neverthrow';",
          "import type { Logger } from '@tempot/logger';",
          "import { USER_MANAGEMENT_MODULE } from '../module.config.js';",
        ].join('\n'),
      },
    ]);

    expect(report.violations).toHaveLength(0);
  });
});
