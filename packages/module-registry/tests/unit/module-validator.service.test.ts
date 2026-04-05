import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModuleValidator } from '../../src/module-validator.service.js';
import type {
  DiscoveredModule,
  ModuleConfig,
  RegistryLogger,
  ValidationError,
} from '../../src/module-registry.types.js';

function createLogger(): RegistryLogger {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };
}

function createValidConfig(overrides?: Partial<ModuleConfig>): ModuleConfig {
  return {
    name: 'test-module',
    version: '1.0.0',
    requiredRole: 'USER',
    commands: [{ command: 'test', description: 'Test command' }],
    features: {
      hasDatabase: false,
      hasNotifications: false,
      hasAttachments: false,
      hasExport: false,
      hasAI: false,
      hasInputEngine: false,
      hasImport: false,
      hasSearch: false,
      hasDynamicCMS: false,
      hasRegional: false,
    },
    isActive: true,
    isCore: false,
    requires: { packages: ['shared'], optional: [] },
    ...overrides,
  };
}

function createModule(overrides?: Partial<DiscoveredModule>): DiscoveredModule {
  return {
    name: 'test-module',
    path: '/modules/test-module',
    config: createValidConfig(),
    ...overrides,
  };
}

/** All mandatory structural paths for a module */
const MANDATORY_PATHS = [
  'module.config.ts',
  'abilities.ts',
  'locales/ar.json',
  'locales/en.json',
  'index.ts',
  'features',
  'shared',
];

/** Standard listDir mock returning spec entries for /specs and packages for /packages */
function createListDir(specEntries: string[]): (path: string) => Promise<string[]> {
  return async (path: string) => {
    if (path === '/specs') return specEntries;
    if (path === '/packages') return ['shared'];
    return [];
  };
}

/** Standard pathExists mock that passes all mandatory paths and optionally spec.md */
function createPathExists(
  opts: { specMdPaths?: string[]; exclude?: string[]; include?: string[] } = {},
): (path: string) => Promise<boolean> {
  return async (path: string) => {
    if (opts.exclude?.some((ex) => path.endsWith(ex))) return false;
    if (opts.include?.some((inc) => path.endsWith(inc))) return true;
    if (opts.specMdPaths?.some((sp) => path === sp)) return true;
    return MANDATORY_PATHS.some((p) => path.endsWith(p));
  };
}

describe('ModuleValidator', () => {
  let logger: RegistryLogger;

  beforeEach(() => {
    logger = createLogger();
  });

  describe('structural validation', () => {
    it('should pass with all mandatory files', async () => {
      const module = createModule();
      const validator = new ModuleValidator({
        specsDir: '/specs',
        packagesDir: '/packages',
        listDir: createListDir(['019-test-module']),
        pathExists: createPathExists({ specMdPaths: ['/specs/019-test-module/spec.md'] }),
        logger,
      });

      const result = await validator.validate([module]);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.validated).toHaveLength(1);
        expect(result.value.failed).toHaveLength(0);
      }
    });

    it('should fail when abilities.ts is missing', async () => {
      const module = createModule();
      const validator = new ModuleValidator({
        specsDir: '/specs',
        packagesDir: '/packages',
        listDir: createListDir(['019-test-module']),
        pathExists: createPathExists({
          specMdPaths: ['/specs/019-test-module/spec.md'],
          exclude: ['abilities.ts'],
        }),
        logger,
      });

      const result = await validator.validate([module]);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.validated).toHaveLength(0);
        expect(
          result.value.failed.some((e: ValidationError) => e.message.includes('abilities.ts')),
        ).toBe(true);
      }
    });

    it('should fail when locales/ar.json is missing', async () => {
      const module = createModule();
      const validator = new ModuleValidator({
        specsDir: '/specs',
        packagesDir: '/packages',
        listDir: createListDir(['019-test-module']),
        pathExists: createPathExists({
          specMdPaths: ['/specs/019-test-module/spec.md'],
          exclude: ['locales/ar.json'],
        }),
        logger,
      });

      const result = await validator.validate([module]);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(
          result.value.failed.some((e: ValidationError) => e.message.includes('ar.json')),
        ).toBe(true);
      }
    });

    it('should fail when locales/en.json is missing', async () => {
      const module = createModule();
      const validator = new ModuleValidator({
        specsDir: '/specs',
        packagesDir: '/packages',
        listDir: createListDir(['019-test-module']),
        pathExists: createPathExists({
          specMdPaths: ['/specs/019-test-module/spec.md'],
          exclude: ['locales/en.json'],
        }),
        logger,
      });

      const result = await validator.validate([module]);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(
          result.value.failed.some((e: ValidationError) => e.message.includes('en.json')),
        ).toBe(true);
      }
    });

    it('should fail when index.ts is missing', async () => {
      const module = createModule();
      const validator = new ModuleValidator({
        specsDir: '/specs',
        packagesDir: '/packages',
        listDir: createListDir(['019-test-module']),
        pathExists: async (path: string) => {
          if (path.endsWith('index.ts') && path.includes('test-module')) return false;
          if (path === '/specs/019-test-module/spec.md') return true;
          return MANDATORY_PATHS.some((p) => path.endsWith(p));
        },
        logger,
      });

      const result = await validator.validate([module]);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(
          result.value.failed.some((e: ValidationError) => e.message.includes('index.ts')),
        ).toBe(true);
      }
    });

    it('should fail when features/ directory is missing', async () => {
      const module = createModule();
      const validator = new ModuleValidator({
        specsDir: '/specs',
        packagesDir: '/packages',
        listDir: createListDir(['019-test-module']),
        pathExists: createPathExists({
          specMdPaths: ['/specs/019-test-module/spec.md'],
          exclude: ['/features'],
        }),
        logger,
      });

      const result = await validator.validate([module]);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(
          result.value.failed.some((e: ValidationError) => e.message.includes('features')),
        ).toBe(true);
      }
    });

    it('should fail when shared/ directory is missing', async () => {
      const module = createModule();
      const validator = new ModuleValidator({
        specsDir: '/specs',
        packagesDir: '/packages',
        listDir: createListDir(['019-test-module']),
        pathExists: createPathExists({
          specMdPaths: ['/specs/019-test-module/spec.md'],
          exclude: ['/shared'],
        }),
        logger,
      });

      const result = await validator.validate([module]);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.failed.some((e: ValidationError) => e.message.includes('shared'))).toBe(
          true,
        );
      }
    });

    it('should fail when hasDatabase is true and schema.prisma missing', async () => {
      const config = createValidConfig({
        features: {
          ...createValidConfig().features,
          hasDatabase: true,
        },
      });
      const module = createModule({ config, name: config.name });
      const validator = new ModuleValidator({
        specsDir: '/specs',
        packagesDir: '/packages',
        listDir: createListDir(['019-test-module']),
        pathExists: createPathExists({
          specMdPaths: ['/specs/019-test-module/spec.md'],
          exclude: ['database'],
        }),
        logger,
      });

      const result = await validator.validate([module]);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(
          result.value.failed.some((e: ValidationError) => e.message.includes('schema.prisma')),
        ).toBe(true);
      }
    });

    it('should fail when hasDatabase is true and migrations/ missing', async () => {
      const config = createValidConfig({
        features: {
          ...createValidConfig().features,
          hasDatabase: true,
        },
      });
      const module = createModule({ config, name: config.name });
      const validator = new ModuleValidator({
        specsDir: '/specs',
        packagesDir: '/packages',
        listDir: createListDir(['019-test-module']),
        pathExists: createPathExists({
          specMdPaths: ['/specs/019-test-module/spec.md'],
          exclude: ['database/migrations'],
          include: ['schema.prisma'],
        }),
        logger,
      });

      const result = await validator.validate([module]);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(
          result.value.failed.some((e: ValidationError) => e.message.includes('migrations')),
        ).toBe(true);
      }
    });

    it('should pass when hasDatabase is false without database dir', async () => {
      const module = createModule();
      const validator = new ModuleValidator({
        specsDir: '/specs',
        packagesDir: '/packages',
        listDir: createListDir(['019-test-module']),
        pathExists: createPathExists({ specMdPaths: ['/specs/019-test-module/spec.md'] }),
        logger,
      });

      const result = await validator.validate([module]);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.validated).toHaveLength(1);
      }
    });

    it('should warn but pass when tests/ directory is missing', async () => {
      const module = createModule();
      const validator = new ModuleValidator({
        specsDir: '/specs',
        packagesDir: '/packages',
        listDir: createListDir(['019-test-module']),
        pathExists: createPathExists({
          specMdPaths: ['/specs/019-test-module/spec.md'],
          exclude: ['/tests'],
        }),
        logger,
      });

      const result = await validator.validate([module]);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.validated).toHaveLength(1);
        expect(logger.warn).toHaveBeenCalled();
      }
    });
  });

  describe('spec gate', () => {
    it('should pass when matching spec dir with spec.md exists', async () => {
      const module = createModule();
      const validator = new ModuleValidator({
        specsDir: '/specs',
        packagesDir: '/packages',
        listDir: createListDir(['019-test-module']),
        pathExists: createPathExists({ specMdPaths: ['/specs/019-test-module/spec.md'] }),
        logger,
      });

      const result = await validator.validate([module]);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.validated).toHaveLength(1);
      }
    });

    it('should fail when no matching spec dir exists', async () => {
      const module = createModule();
      const validator = new ModuleValidator({
        specsDir: '/specs',
        packagesDir: '/packages',
        listDir: createListDir(['001-other-module']),
        pathExists: createPathExists({}),
        logger,
      });

      const result = await validator.validate([module]);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.failed.some((e: ValidationError) => e.code.includes('spec_gate'))).toBe(
          true,
        );
      }
    });

    it('should match with {name}-package suffix', async () => {
      const module = createModule();
      const validator = new ModuleValidator({
        specsDir: '/specs',
        packagesDir: '/packages',
        listDir: createListDir(['019-test-module-package']),
        pathExists: createPathExists({
          specMdPaths: ['/specs/019-test-module-package/spec.md'],
        }),
        logger,
      });

      const result = await validator.validate([module]);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.validated).toHaveLength(1);
      }
    });
  });

  describe('dependency validation', () => {
    it('should pass when all required packages are available', async () => {
      const config = createValidConfig({
        requires: { packages: ['shared', 'logger'], optional: [] },
      });
      const module = createModule({ config, name: config.name });
      const validator = new ModuleValidator({
        specsDir: '/specs',
        packagesDir: '/packages',
        listDir: async (path: string) => {
          if (path === '/specs') return ['019-test-module'];
          if (path === '/packages') return ['shared', 'logger'];
          return [];
        },
        pathExists: async (path: string) => {
          if (path === '/specs/019-test-module/spec.md') return true;
          return MANDATORY_PATHS.some((p) => path.endsWith(p));
        },
        logger,
      });

      const result = await validator.validate([module]);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.validated).toHaveLength(1);
      }
    });

    it('should fail when required package is missing', async () => {
      const config = createValidConfig({
        requires: { packages: ['shared', 'nonexistent-pkg'], optional: [] },
      });
      const module = createModule({ config, name: config.name });
      const validator = new ModuleValidator({
        specsDir: '/specs',
        packagesDir: '/packages',
        listDir: async (path: string) => {
          if (path === '/specs') return ['019-test-module'];
          if (path === '/packages') return ['shared', 'logger'];
          return [];
        },
        pathExists: async (path: string) => {
          if (path === '/specs/019-test-module/spec.md') return true;
          return MANDATORY_PATHS.some((p) => path.endsWith(p));
        },
        logger,
      });

      const result = await validator.validate([module]);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(
          result.value.failed.some((e: ValidationError) => e.code.includes('dependency')),
        ).toBe(true);
      }
    });

    it('should pass with hasNotifications and notifier available', async () => {
      const config = createValidConfig({
        features: {
          ...createValidConfig().features,
          hasNotifications: true,
        },
        requires: { packages: ['shared'], optional: [] },
      });
      const module = createModule({ config, name: config.name });
      const validator = new ModuleValidator({
        specsDir: '/specs',
        packagesDir: '/packages',
        listDir: async (path: string) => {
          if (path === '/specs') return ['019-test-module'];
          if (path === '/packages') return ['shared', 'notifier'];
          return [];
        },
        pathExists: async (path: string) => {
          if (path === '/specs/019-test-module/spec.md') return true;
          return MANDATORY_PATHS.some((p) => path.endsWith(p));
        },
        logger,
      });

      const result = await validator.validate([module]);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.validated).toHaveLength(1);
      }
    });

    it('should fail with hasNotifications and notifier missing', async () => {
      const config = createValidConfig({
        features: {
          ...createValidConfig().features,
          hasNotifications: true,
        },
        requires: { packages: ['shared'], optional: [] },
      });
      const module = createModule({ config, name: config.name });
      const validator = new ModuleValidator({
        specsDir: '/specs',
        packagesDir: '/packages',
        listDir: async (path: string) => {
          if (path === '/specs') return ['019-test-module'];
          if (path === '/packages') return ['shared'];
          return [];
        },
        pathExists: async (path: string) => {
          if (path === '/specs/019-test-module/spec.md') return true;
          return MANDATORY_PATHS.some((p) => path.endsWith(p));
        },
        logger,
      });

      const result = await validator.validate([module]);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(
          result.value.failed.some((e: ValidationError) => e.code.includes('dependency')),
        ).toBe(true);
      }
    });

    it('should warn but pass when optional package is missing', async () => {
      const config = createValidConfig({
        requires: { packages: ['shared'], optional: ['ai-core'] },
      });
      const module = createModule({ config, name: config.name });
      const validator = new ModuleValidator({
        specsDir: '/specs',
        packagesDir: '/packages',
        listDir: async (path: string) => {
          if (path === '/specs') return ['019-test-module'];
          if (path === '/packages') return ['shared'];
          return [];
        },
        pathExists: async (path: string) => {
          if (path === '/specs/019-test-module/spec.md') return true;
          return MANDATORY_PATHS.some((p) => path.endsWith(p));
        },
        logger,
      });

      const result = await validator.validate([module]);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.validated).toHaveLength(1);
        expect(logger.warn).toHaveBeenCalled();
      }
    });
  });

  describe('name uniqueness', () => {
    it('should pass when two modules have different names', async () => {
      const moduleA = createModule({
        name: 'module-a',
        path: '/modules/module-a',
        config: createValidConfig({ name: 'module-a' }),
      });
      const moduleB = createModule({
        name: 'module-b',
        path: '/modules/module-b',
        config: createValidConfig({ name: 'module-b' }),
      });
      const validator = new ModuleValidator({
        specsDir: '/specs',
        packagesDir: '/packages',
        listDir: async (path: string) => {
          if (path === '/specs') return ['019-module-a', '020-module-b'];
          if (path === '/packages') return ['shared'];
          return [];
        },
        pathExists: async (path: string) => {
          if (path.endsWith('spec.md')) return true;
          return MANDATORY_PATHS.some((p) => path.endsWith(p));
        },
        logger,
      });

      const result = await validator.validate([moduleA, moduleB]);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.validated).toHaveLength(2);
      }
    });

    it('should fail second module with duplicate name', async () => {
      const moduleA = createModule({
        name: 'dup-module',
        path: '/modules/dup-module-1',
        config: createValidConfig({ name: 'dup-module' }),
      });
      const moduleB = createModule({
        name: 'dup-module',
        path: '/modules/dup-module-2',
        config: createValidConfig({ name: 'dup-module' }),
      });
      const validator = new ModuleValidator({
        specsDir: '/specs',
        packagesDir: '/packages',
        listDir: async (path: string) => {
          if (path === '/specs') return ['019-dup-module'];
          if (path === '/packages') return ['shared'];
          return [];
        },
        pathExists: async (path: string) => {
          if (path.endsWith('spec.md')) return true;
          return MANDATORY_PATHS.some((p) => path.endsWith(p));
        },
        logger,
      });

      const result = await validator.validate([moduleA, moduleB]);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.validated).toHaveLength(1);
        expect(result.value.failed.some((e: ValidationError) => e.code.includes('duplicate'))).toBe(
          true,
        );
      }
    });
  });

  describe('error accumulation (DC-5)', () => {
    it('should accumulate all errors for a module', async () => {
      const module = createModule();
      const validator = new ModuleValidator({
        specsDir: '/specs',
        packagesDir: '/packages',
        listDir: async () => [],
        pathExists: async () => false, // All checks fail
        logger,
      });

      const result = await validator.validate([module]);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        // Should have multiple errors (structural + spec gate + deps)
        expect(result.value.failed.length).toBeGreaterThan(1);
      }
    });
  });
});
