import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ok } from 'neverthrow';
import { ModuleRegistry } from '../../src/module-registry.service.js';
import { MODULE_REGISTRY_ERRORS } from '../../src/module-registry.errors.js';
import type {
  DiscoveryResult,
  ModuleCommand,
  ModuleConfig,
  ModuleDiscoveryPort,
  ModuleValidatorPort,
  RegistryBot,
  RegistryEventBus,
  RegistryLogger,
  ValidatedModule,
  ValidationResult,
} from '../../src/module-registry.types.js';

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

function createValidatedModule(overrides?: Partial<ValidatedModule>): ValidatedModule {
  return {
    name: 'test-module',
    path: '/modules/test-module',
    config: createValidConfig(),
    validatedAt: new Date(),
    ...overrides,
  };
}

function createDiscoveryResult(overrides?: Partial<DiscoveryResult>): DiscoveryResult {
  return {
    discovered: [
      { name: 'test-module', path: '/modules/test-module', config: createValidConfig() },
    ],
    skipped: [],
    failed: [],
    ...overrides,
  };
}

function createValidationResult(overrides?: Partial<ValidationResult>): ValidationResult {
  return {
    validated: [createValidatedModule()],
    skipped: [],
    failed: [],
    ...overrides,
  };
}

describe('ModuleRegistry', () => {
  let logger: RegistryLogger;
  let eventBus: RegistryEventBus;

  beforeEach(() => {
    logger = createLogger();
    eventBus = createEventBus();
  });

  describe('discover()', () => {
    it('should delegate to discovery service and return result', async () => {
      const discoveryResult = createDiscoveryResult();
      const discovery: ModuleDiscoveryPort = {
        discover: vi.fn().mockResolvedValue(ok(discoveryResult)),
      };
      const validator: ModuleValidatorPort = { validate: vi.fn() };

      const registry = new ModuleRegistry({ discovery, validator, eventBus, logger });
      const result = await registry.discover();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.discovered).toHaveLength(1);
      }
      expect(discovery.discover).toHaveBeenCalled();
    });

    it('should emit discovery.completed event', async () => {
      const discoveryResult = createDiscoveryResult();
      const discovery: ModuleDiscoveryPort = {
        discover: vi.fn().mockResolvedValue(ok(discoveryResult)),
      };
      const validator: ModuleValidatorPort = { validate: vi.fn() };

      const registry = new ModuleRegistry({ discovery, validator, eventBus, logger });
      await registry.discover();

      expect(eventBus.publish).toHaveBeenCalledWith(
        'module-registry.discovery.completed',
        expect.objectContaining({
          modulesFound: 1,
          modulesSkipped: 0,
          modulesFailed: 0,
        }),
      );
    });

    it('should log discovery summary', async () => {
      const discoveryResult = createDiscoveryResult({
        skipped: ['inactive-mod'],
        failed: [{ path: '/modules/broken', error: 'bad config' }],
      });
      const discovery: ModuleDiscoveryPort = {
        discover: vi.fn().mockResolvedValue(ok(discoveryResult)),
      };
      const validator: ModuleValidatorPort = { validate: vi.fn() };

      const registry = new ModuleRegistry({ discovery, validator, eventBus, logger });
      await registry.discover();

      expect(logger.info).toHaveBeenCalled();
    });
  });

  describe('validate()', () => {
    it('should return error when called before discover()', async () => {
      const discovery: ModuleDiscoveryPort = { discover: vi.fn() };
      const validator: ModuleValidatorPort = { validate: vi.fn() };

      const registry = new ModuleRegistry({ discovery, validator, eventBus, logger });
      const result = await registry.validate();

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(MODULE_REGISTRY_ERRORS.NOT_DISCOVERED);
      }
    });

    it('should delegate to validator and return result', async () => {
      const discoveryResult = createDiscoveryResult();
      const validationResult = createValidationResult();
      const discovery: ModuleDiscoveryPort = {
        discover: vi.fn().mockResolvedValue(ok(discoveryResult)),
      };
      const validator: ModuleValidatorPort = {
        validate: vi.fn().mockResolvedValue(ok(validationResult)),
      };

      const registry = new ModuleRegistry({ discovery, validator, eventBus, logger });
      await registry.discover();
      const result = await registry.validate();

      expect(result.isOk()).toBe(true);
      expect(validator.validate).toHaveBeenCalledWith(discoveryResult.discovered);
    });

    it('should emit module.validated for each valid module', async () => {
      const discoveryResult = createDiscoveryResult();
      const validationResult = createValidationResult();
      const discovery: ModuleDiscoveryPort = {
        discover: vi.fn().mockResolvedValue(ok(discoveryResult)),
      };
      const validator: ModuleValidatorPort = {
        validate: vi.fn().mockResolvedValue(ok(validationResult)),
      };

      const registry = new ModuleRegistry({ discovery, validator, eventBus, logger });
      await registry.discover();
      await registry.validate();

      expect(eventBus.publish).toHaveBeenCalledWith(
        'module-registry.module.validated',
        expect.objectContaining({ moduleName: 'test-module' }),
      );
    });

    it('should emit module.validation_failed for failed modules', async () => {
      const discoveryResult = createDiscoveryResult();
      const validationResult = createValidationResult({
        validated: [],
        failed: [
          {
            module: 'test-module',
            code: MODULE_REGISTRY_ERRORS.STRUCTURE_INVALID,
            message: 'Missing file',
          },
        ],
      });
      const discovery: ModuleDiscoveryPort = {
        discover: vi.fn().mockResolvedValue(ok(discoveryResult)),
      };
      const validator: ModuleValidatorPort = {
        validate: vi.fn().mockResolvedValue(ok(validationResult)),
      };

      const registry = new ModuleRegistry({ discovery, validator, eventBus, logger });
      await registry.discover();
      await registry.validate();

      expect(eventBus.publish).toHaveBeenCalledWith(
        'module-registry.module.validation_failed',
        expect.objectContaining({ moduleName: 'test-module' }),
      );
    });

    it('should return fatal error when core module fails validation', async () => {
      const coreConfig = createValidConfig({ name: 'core-mod', isCore: true });
      const discoveryResult = createDiscoveryResult({
        discovered: [{ name: 'core-mod', path: '/modules/core-mod', config: coreConfig }],
      });
      const validationResult = createValidationResult({
        validated: [],
        failed: [
          {
            module: 'core-mod',
            code: MODULE_REGISTRY_ERRORS.STRUCTURE_INVALID,
            message: 'Missing file',
          },
        ],
      });
      const discovery: ModuleDiscoveryPort = {
        discover: vi.fn().mockResolvedValue(ok(discoveryResult)),
      };
      const validator: ModuleValidatorPort = {
        validate: vi.fn().mockResolvedValue(ok(validationResult)),
      };

      const registry = new ModuleRegistry({ discovery, validator, eventBus, logger });
      await registry.discover();
      const result = await registry.validate();

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(MODULE_REGISTRY_ERRORS.CORE_MODULE_FAILED);
      }
    });

    it('should warn but succeed when optional module fails', async () => {
      const moduleA = createValidatedModule({ name: 'module-a' });
      const discoveryResult = createDiscoveryResult({
        discovered: [
          {
            name: 'module-a',
            path: '/modules/module-a',
            config: createValidConfig({ name: 'module-a' }),
          },
          {
            name: 'opt-mod',
            path: '/modules/opt-mod',
            config: createValidConfig({ name: 'opt-mod' }),
          },
        ],
      });
      const validationResult = createValidationResult({
        validated: [moduleA],
        failed: [
          {
            module: 'opt-mod',
            code: MODULE_REGISTRY_ERRORS.DEPENDENCY_MISSING,
            message: 'Missing dep',
          },
        ],
      });
      const discovery: ModuleDiscoveryPort = {
        discover: vi.fn().mockResolvedValue(ok(discoveryResult)),
      };
      const validator: ModuleValidatorPort = {
        validate: vi.fn().mockResolvedValue(ok(validationResult)),
      };

      const registry = new ModuleRegistry({ discovery, validator, eventBus, logger });
      await registry.discover();
      const result = await registry.validate();

      expect(result.isOk()).toBe(true);
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should log validation summary', async () => {
      const discoveryResult = createDiscoveryResult();
      const validationResult = createValidationResult();
      const discovery: ModuleDiscoveryPort = {
        discover: vi.fn().mockResolvedValue(ok(discoveryResult)),
      };
      const validator: ModuleValidatorPort = {
        validate: vi.fn().mockResolvedValue(ok(validationResult)),
      };

      const registry = new ModuleRegistry({ discovery, validator, eventBus, logger });
      await registry.discover();
      await registry.validate();

      expect(logger.info).toHaveBeenCalled();
    });
  });

  describe('register()', () => {
    it('should return error when called before validate()', async () => {
      const discovery: ModuleDiscoveryPort = { discover: vi.fn() };
      const validator: ModuleValidatorPort = { validate: vi.fn() };
      const bot = createBot();

      const registry = new ModuleRegistry({ discovery, validator, eventBus, logger });
      const result = await registry.register(bot);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(MODULE_REGISTRY_ERRORS.NOT_VALIDATED);
      }
    });

    it('should register commands via bot and emit events', async () => {
      const discoveryResult = createDiscoveryResult();
      const validationResult = createValidationResult();
      const discovery: ModuleDiscoveryPort = {
        discover: vi.fn().mockResolvedValue(ok(discoveryResult)),
      };
      const validator: ModuleValidatorPort = {
        validate: vi.fn().mockResolvedValue(ok(validationResult)),
      };
      const bot = createBot();

      const registry = new ModuleRegistry({ discovery, validator, eventBus, logger });
      await registry.discover();
      await registry.validate();
      const result = await registry.register(bot);

      expect(result.isOk()).toBe(true);
      expect(bot.api.setMyCommands).toHaveBeenCalledWith([
        { command: 'test', description: 'Test command' },
      ]);
      expect(eventBus.publish).toHaveBeenCalledWith(
        'module-registry.module.registered',
        expect.objectContaining({ moduleName: 'test-module', commandCount: 1 }),
      );
    });
  });

  describe('query methods', () => {
    it('should return module by name after validation', async () => {
      const discoveryResult = createDiscoveryResult();
      const validationResult = createValidationResult();
      const discovery: ModuleDiscoveryPort = {
        discover: vi.fn().mockResolvedValue(ok(discoveryResult)),
      };
      const validator: ModuleValidatorPort = {
        validate: vi.fn().mockResolvedValue(ok(validationResult)),
      };

      const registry = new ModuleRegistry({ discovery, validator, eventBus, logger });
      await registry.discover();
      await registry.validate();

      expect(registry.getModule('test-module')).toBeDefined();
      expect(registry.getModule('nonexistent')).toBeUndefined();
    });

    it('should return all validated modules', async () => {
      const discoveryResult = createDiscoveryResult();
      const validationResult = createValidationResult();
      const discovery: ModuleDiscoveryPort = {
        discover: vi.fn().mockResolvedValue(ok(discoveryResult)),
      };
      const validator: ModuleValidatorPort = {
        validate: vi.fn().mockResolvedValue(ok(validationResult)),
      };

      const registry = new ModuleRegistry({ discovery, validator, eventBus, logger });
      await registry.discover();
      await registry.validate();

      const allModules = registry.getAllModules();
      expect(allModules).toHaveLength(1);
      expect(allModules[0].name).toBe('test-module');
    });

    it('should return all commands from all modules', async () => {
      const moduleA = createValidatedModule({
        name: 'module-a',
        config: createValidConfig({
          name: 'module-a',
          commands: [{ command: 'cmd_a', description: 'Cmd A' }],
        }),
      });
      const moduleB = createValidatedModule({
        name: 'module-b',
        config: createValidConfig({
          name: 'module-b',
          commands: [{ command: 'cmd_b', description: 'Cmd B' }],
        }),
      });
      const discoveryResult = createDiscoveryResult({
        discovered: [
          { name: 'module-a', path: '/m/a', config: moduleA.config },
          { name: 'module-b', path: '/m/b', config: moduleB.config },
        ],
      });
      const validationResult = createValidationResult({
        validated: [moduleA, moduleB],
      });
      const discovery: ModuleDiscoveryPort = {
        discover: vi.fn().mockResolvedValue(ok(discoveryResult)),
      };
      const validator: ModuleValidatorPort = {
        validate: vi.fn().mockResolvedValue(ok(validationResult)),
      };

      const registry = new ModuleRegistry({ discovery, validator, eventBus, logger });
      await registry.discover();
      await registry.validate();

      const commands: ModuleCommand[] = registry.getAllCommands();
      expect(commands).toHaveLength(2);
      expect(commands.map((c) => c.command)).toContain('cmd_a');
      expect(commands.map((c) => c.command)).toContain('cmd_b');
    });

    it('should return empty arrays before validation', async () => {
      const discovery: ModuleDiscoveryPort = { discover: vi.fn() };
      const validator: ModuleValidatorPort = { validate: vi.fn() };

      const registry = new ModuleRegistry({ discovery, validator, eventBus, logger });

      expect(registry.getModule('test')).toBeUndefined();
      expect(registry.getAllModules()).toHaveLength(0);
      expect(registry.getAllCommands()).toHaveLength(0);
    });
  });

  describe('event emission resilience', () => {
    it('should not fail pipeline when event emission throws', async () => {
      const failingEventBus: RegistryEventBus = {
        publish: vi.fn().mockRejectedValue(new Error('Event bus down')),
      };
      const discoveryResult = createDiscoveryResult();
      const discovery: ModuleDiscoveryPort = {
        discover: vi.fn().mockResolvedValue(ok(discoveryResult)),
      };
      const validator: ModuleValidatorPort = { validate: vi.fn() };

      const registry = new ModuleRegistry({
        discovery,
        validator,
        eventBus: failingEventBus,
        logger,
      });
      const result = await registry.discover();

      expect(result.isOk()).toBe(true);
      expect(logger.warn).toHaveBeenCalled();
    });
  });
});
