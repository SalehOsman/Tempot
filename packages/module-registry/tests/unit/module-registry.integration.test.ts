import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModuleDiscovery } from '../../src/module-discovery.service.js';
import { ModuleValidator } from '../../src/module-validator.service.js';
import { ModuleRegistry } from '../../src/module-registry.service.js';
import { MODULE_REGISTRY_ERRORS } from '../../src/module-registry.errors.js';
import type {
  ModuleConfig,
  RegistryBot,
  RegistryEventBus,
  RegistryLogger,
} from '../../src/module-registry.types.js';

// ── Helpers ──────────────────────────────────────────────────

function createLogger(): RegistryLogger {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };
}

function createEventBus(): RegistryEventBus {
  return {
    publish: vi.fn().mockResolvedValue({ isOk: () => true }),
  };
}

function createBot(): RegistryBot {
  return {
    api: {
      setMyCommands: vi.fn().mockResolvedValue(true),
    },
  };
}

function baseFeatures(): ModuleConfig['features'] {
  return {
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
  };
}

function makeConfig(overrides?: Partial<ModuleConfig>): ModuleConfig {
  return {
    name: 'test-module',
    version: '1.0.0',
    requiredRole: 'USER',
    commands: [{ command: 'test', description: 'Test command' }],
    features: baseFeatures(),
    isActive: true,
    isCore: false,
    requires: { packages: ['shared'], optional: [] },
    ...overrides,
  };
}

/** Mandatory structural paths for a module */
const MANDATORY_PATHS = [
  'module.config.ts',
  'abilities.ts',
  'locales/ar.json',
  'locales/en.json',
  'index.ts',
  'features',
  'shared',
  'tests',
];

/**
 * Builds mock FS functions from a declarative module layout.
 * Each module entry produces a valid directory with all mandatory paths.
 */
function buildMockFs(modules: Array<{ name: string; config: ModuleConfig }>) {
  const modulesDir = '/project/modules';
  const specsDir = '/project/specs';
  const packagesDir = '/project/packages';

  // All paths that "exist" in our virtual FS
  const existingPaths = new Set<string>();

  // Module directories + their mandatory paths
  for (const mod of modules) {
    const modDir = `${modulesDir}/${mod.name}`;
    existingPaths.add(modDir);
    for (const p of MANDATORY_PATHS) {
      existingPaths.add(`${modDir}/${p}`);
    }
    // Spec directory with spec.md
    existingPaths.add(`${specsDir}/019-${mod.name}-package`);
    existingPaths.add(`${specsDir}/019-${mod.name}-package/spec.md`);
  }

  // Available packages (shared + everything in FEATURE_PACKAGE_MAP that we may need)
  const availablePackages = [
    'shared',
    'notifier',
    'storage-engine',
    'ai-core',
    'input-engine',
    'import-engine',
    'search-engine',
    'cms-engine',
    'regional-engine',
  ];

  const dirEntries: Record<string, string[]> = {
    [modulesDir]: modules.map((m) => m.name),
    [specsDir]: modules.map((m) => `019-${m.name}-package`),
    [packagesDir]: availablePackages,
  };

  const configMap = new Map<string, ModuleConfig>();
  for (const mod of modules) {
    configMap.set(`${modulesDir}/${mod.name}/module.config.ts`, mod.config);
  }

  const listDir = vi.fn(async (path: string) => {
    if (dirEntries[path]) return dirEntries[path];
    throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
  });

  const isDirectory = vi.fn(async (path: string) => existingPaths.has(path));

  const pathExists = vi.fn(async (path: string) => existingPaths.has(path));

  const loadConfig = vi.fn(async (path: string): Promise<unknown> => {
    const config = configMap.get(path);
    if (!config) throw new Error(`Config not found: ${path}`);
    return { default: config };
  });

  return { modulesDir, specsDir, packagesDir, listDir, isDirectory, pathExists, loadConfig };
}

interface IntegrationDeps {
  registry: ModuleRegistry;
  eventBus: RegistryEventBus;
  logger: RegistryLogger;
  bot: RegistryBot;
}

function createPipeline(
  modules: Array<{ name: string; config: ModuleConfig }>,
  fsOverrides?: Partial<ReturnType<typeof buildMockFs>>,
): IntegrationDeps {
  const logger = createLogger();
  const eventBus = createEventBus();
  const bot = createBot();
  const fs = { ...buildMockFs(modules), ...fsOverrides };

  const discovery = new ModuleDiscovery({
    modulesDir: fs.modulesDir,
    loadConfig: fs.loadConfig,
    listDir: fs.listDir,
    isDirectory: fs.isDirectory,
    logger,
  });

  const validator = new ModuleValidator({
    specsDir: fs.specsDir,
    packagesDir: fs.packagesDir,
    listDir: fs.listDir,
    pathExists: fs.pathExists,
    logger,
  });

  const registry = new ModuleRegistry({ discovery, validator, eventBus, logger });

  return { registry, eventBus, logger, bot };
}

// ── Tests ────────────────────────────────────────────────────

describe('Module Registry — Integration', () => {
  let eventBus: RegistryEventBus;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('full pipeline: discover 3 modules → validate → register commands', async () => {
    const modules = [
      {
        name: 'alpha',
        config: makeConfig({
          name: 'alpha',
          commands: [{ command: 'alpha', description: 'Alpha cmd' }],
        }),
      },
      {
        name: 'beta',
        config: makeConfig({
          name: 'beta',
          commands: [{ command: 'beta', description: 'Beta cmd' }],
        }),
      },
      {
        name: 'gamma',
        config: makeConfig({
          name: 'gamma',
          commands: [{ command: 'gamma', description: 'Gamma cmd' }],
        }),
      },
    ];
    const pipeline = createPipeline(modules);
    eventBus = pipeline.eventBus;

    // Discover
    const discoverResult = await pipeline.registry.discover();
    expect(discoverResult.isOk()).toBe(true);
    if (discoverResult.isOk()) {
      expect(discoverResult.value.discovered).toHaveLength(3);
    }

    // Validate
    const validateResult = await pipeline.registry.validate();
    expect(validateResult.isOk()).toBe(true);
    if (validateResult.isOk()) {
      expect(validateResult.value.validated).toHaveLength(3);
      expect(validateResult.value.failed).toHaveLength(0);
    }

    // Register
    const registerResult = await pipeline.registry.register(pipeline.bot);
    expect(registerResult.isOk()).toBe(true);
    expect(pipeline.bot.api.setMyCommands).toHaveBeenCalledWith(
      expect.arrayContaining([
        { command: 'alpha', description: 'Alpha cmd' },
        { command: 'beta', description: 'Beta cmd' },
        { command: 'gamma', description: 'Gamma cmd' },
      ]),
    );

    // Verify events
    expect(eventBus.publish).toHaveBeenCalledWith(
      'module-registry.discovery.completed',
      expect.objectContaining({ modulesFound: 3 }),
    );
    expect(eventBus.publish).toHaveBeenCalledWith(
      'module-registry.module.registered',
      expect.objectContaining({ moduleName: 'alpha' }),
    );

    // Query interface
    expect(pipeline.registry.getAllModules()).toHaveLength(3);
    expect(pipeline.registry.getAllCommands()).toHaveLength(3);
  });

  it('core module failure: core module with missing file → fatal error', async () => {
    const coreConfig = makeConfig({ name: 'core-mod', isCore: true });
    const optConfig = makeConfig({ name: 'opt-mod', isCore: false });
    const modules = [
      { name: 'core-mod', config: coreConfig },
      { name: 'opt-mod', config: optConfig },
    ];
    const fs = buildMockFs(modules);

    // Remove a mandatory file from core module
    const origPathExists = fs.pathExists.getMockImplementation()!;
    fs.pathExists.mockImplementation(async (path: string) => {
      if (path === '/project/modules/core-mod/abilities.ts') return false;
      return origPathExists(path);
    });

    const pipeline = createPipeline(modules, { pathExists: fs.pathExists });

    await pipeline.registry.discover();
    const result = await pipeline.registry.validate();

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(MODULE_REGISTRY_ERRORS.CORE_MODULE_FAILED);
    }
  });

  it('optional module failure: valid core + invalid optional → core registered, optional skipped', async () => {
    const coreConfig = makeConfig({
      name: 'core-mod',
      isCore: true,
      commands: [{ command: 'core', description: 'Core' }],
    });
    const optConfig = makeConfig({ name: 'opt-mod', isCore: false });
    const modules = [
      { name: 'core-mod', config: coreConfig },
      { name: 'opt-mod', config: optConfig },
    ];
    const fs = buildMockFs(modules);

    // Remove a mandatory file from optional module
    const origPathExists = fs.pathExists.getMockImplementation()!;
    fs.pathExists.mockImplementation(async (path: string) => {
      if (path === '/project/modules/opt-mod/abilities.ts') return false;
      return origPathExists(path);
    });

    const pipeline = createPipeline(modules, { pathExists: fs.pathExists });

    await pipeline.registry.discover();
    const validateResult = await pipeline.registry.validate();

    expect(validateResult.isOk()).toBe(true);
    if (validateResult.isOk()) {
      expect(validateResult.value.validated).toHaveLength(1);
      expect(validateResult.value.validated[0].name).toBe('core-mod');
      expect(validateResult.value.failed.length).toBeGreaterThan(0);
      expect(validateResult.value.failed[0].module).toBe('opt-mod');
    }

    // Register — only core commands
    const registerResult = await pipeline.registry.register(pipeline.bot);
    expect(registerResult.isOk()).toBe(true);
    expect(pipeline.bot.api.setMyCommands).toHaveBeenCalledWith([
      { command: 'core', description: 'Core' },
    ]);
  });

  it('empty modules directory → discover returns empty, register is no-op', async () => {
    const pipeline = createPipeline([]);

    const discoverResult = await pipeline.registry.discover();
    expect(discoverResult.isOk()).toBe(true);
    if (discoverResult.isOk()) {
      expect(discoverResult.value.discovered).toHaveLength(0);
    }

    const validateResult = await pipeline.registry.validate();
    expect(validateResult.isOk()).toBe(true);
    if (validateResult.isOk()) {
      expect(validateResult.value.validated).toHaveLength(0);
    }
  });

  it('inactive module → skipped during discovery', async () => {
    const inactiveConfig = makeConfig({ name: 'sleeping', isActive: false });
    const modules = [{ name: 'sleeping', config: inactiveConfig }];
    const pipeline = createPipeline(modules);

    const discoverResult = await pipeline.registry.discover();
    expect(discoverResult.isOk()).toBe(true);
    if (discoverResult.isOk()) {
      expect(discoverResult.value.discovered).toHaveLength(0);
      expect(discoverResult.value.skipped).toContain('sleeping');
    }

    expect(pipeline.logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ msg: 'Module inactive, skipping', module: 'sleeping' }),
    );
  });

  it('spec gate: module without spec directory → fails validation', async () => {
    const modules = [{ name: 'no-spec', config: makeConfig({ name: 'no-spec' }) }];
    const fs = buildMockFs(modules);

    // Remove spec directory from the listing
    const origListDir = fs.listDir.getMockImplementation()!;
    fs.listDir.mockImplementation(async (path: string) => {
      if (path === '/project/specs') return []; // no spec dirs
      return origListDir(path);
    });

    const pipeline = createPipeline(modules, { listDir: fs.listDir });

    await pipeline.registry.discover();
    const result = await pipeline.registry.validate();

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.validated).toHaveLength(0);
      expect(result.value.failed).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            module: 'no-spec',
            code: MODULE_REGISTRY_ERRORS.SPEC_GATE_FAILED,
          }),
        ]),
      );
    }
  });

  it('dependency validation: hasAI=true but ai-core unavailable → fails', async () => {
    const aiConfig = makeConfig({
      name: 'ai-mod',
      features: { ...baseFeatures(), hasAI: true },
      aiDegradationMode: 'graceful',
    });
    const modules = [{ name: 'ai-mod', config: aiConfig }];
    const fs = buildMockFs(modules);

    // Remove ai-core from available packages
    const origListDir = fs.listDir.getMockImplementation()!;
    fs.listDir.mockImplementation(async (path: string) => {
      if (path === '/project/packages') return ['shared']; // no ai-core
      return origListDir(path);
    });

    const pipeline = createPipeline(modules, { listDir: fs.listDir });

    await pipeline.registry.discover();
    const result = await pipeline.registry.validate();

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.validated).toHaveLength(0);
      expect(result.value.failed).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            module: 'ai-mod',
            code: MODULE_REGISTRY_ERRORS.DEPENDENCY_MISSING,
            message: expect.stringContaining('ai-core'),
          }),
        ]),
      );
    }
  });

  it('duplicate names: two modules with same name → second one fails', async () => {
    const configA = makeConfig({ name: 'duplicate' });
    const configB = makeConfig({ name: 'duplicate' });
    const modulesDir = '/project/modules';
    const specsDir = '/project/specs';
    const packagesDir = '/project/packages';

    // Build a custom FS where two directories return configs with same name
    const allPackages = [
      'shared',
      'notifier',
      'storage-engine',
      'ai-core',
      'input-engine',
      'import-engine',
      'search-engine',
      'cms-engine',
      'regional-engine',
    ];

    const existingPaths = new Set<string>();
    for (const dir of ['dir-a', 'dir-b']) {
      existingPaths.add(`${modulesDir}/${dir}`);
      for (const p of MANDATORY_PATHS) {
        existingPaths.add(`${modulesDir}/${dir}/${p}`);
      }
    }
    existingPaths.add(`${specsDir}/019-duplicate-package`);
    existingPaths.add(`${specsDir}/019-duplicate-package/spec.md`);

    const listDir = vi.fn(async (path: string) => {
      if (path === modulesDir) return ['dir-a', 'dir-b'];
      if (path === specsDir) return ['019-duplicate-package'];
      if (path === packagesDir) return allPackages;
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    });

    const isDirectory = vi.fn(async (path: string) => existingPaths.has(path));
    const pathExists = vi.fn(async (path: string) => existingPaths.has(path));
    const loadConfig = vi.fn(async (path: string): Promise<unknown> => {
      if (path.includes('dir-a')) return { default: configA };
      if (path.includes('dir-b')) return { default: configB };
      throw new Error('Config not found');
    });

    const logger = createLogger();
    const eventBus = createEventBus();

    const discovery = new ModuleDiscovery({
      modulesDir,
      loadConfig,
      listDir,
      isDirectory,
      logger,
    });
    const validator = new ModuleValidator({
      specsDir,
      packagesDir,
      listDir,
      pathExists,
      logger,
    });
    const registry = new ModuleRegistry({ discovery, validator, eventBus, logger });

    await registry.discover();
    const result = await registry.validate();

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      // First module should pass, second should fail with DUPLICATE_NAME
      expect(result.value.validated).toHaveLength(1);
      expect(result.value.failed).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            module: 'duplicate',
            code: MODULE_REGISTRY_ERRORS.DUPLICATE_NAME,
          }),
        ]),
      );
    }
  });

  it('performance: discovery + validation completes within 500ms', async () => {
    const modules = [
      { name: 'perf-a', config: makeConfig({ name: 'perf-a' }) },
      { name: 'perf-b', config: makeConfig({ name: 'perf-b' }) },
      { name: 'perf-c', config: makeConfig({ name: 'perf-c' }) },
    ];
    const pipeline = createPipeline(modules);

    const start = performance.now();

    await pipeline.registry.discover();
    await pipeline.registry.validate();

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(500);
  });
});
