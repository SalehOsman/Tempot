import { describe, it, expect, vi } from 'vitest';
import { ModuleDiscovery } from '../../src/module-discovery.service.js';
import type { ModuleConfig, RegistryLogger } from '../../src/module-registry.types.js';

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

describe('ModuleDiscovery', () => {
  it('should discover modules with valid configs', async () => {
    const logger = createLogger();
    const config = createValidConfig();

    const discovery = new ModuleDiscovery({
      modulesDir: '/fake/modules',
      loadConfig: async () => ({ default: config }),
      listDir: async () => ['test-module'],
      isDirectory: async () => true,
      logger,
    });

    const result = await discovery.discover();

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.discovered).toHaveLength(1);
      expect(result.value.discovered[0].name).toBe('test-module');
      expect(result.value.discovered[0].config).toEqual(config);
      expect(result.value.skipped).toHaveLength(0);
      expect(result.value.failed).toHaveLength(0);
    }
  });

  it('should skip directories without module.config.ts', async () => {
    const logger = createLogger();

    const discovery = new ModuleDiscovery({
      modulesDir: '/fake/modules',
      loadConfig: async () => {
        throw new Error('Module not found');
      },
      listDir: async () => ['no-config-dir'],
      isDirectory: async () => true,
      logger,
    });

    const result = await discovery.discover();

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.discovered).toHaveLength(0);
      expect(result.value.failed).toHaveLength(1);
      expect(result.value.failed[0].path).toContain('no-config-dir');
    }
  });

  it('should return empty result when modules directory does not exist', async () => {
    const logger = createLogger();

    const discovery = new ModuleDiscovery({
      modulesDir: '/nonexistent',
      loadConfig: async () => ({}),
      listDir: async () => {
        throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
      },
      isDirectory: async () => false,
      logger,
    });

    const result = await discovery.discover();

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.discovered).toHaveLength(0);
      expect(result.value.skipped).toHaveLength(0);
      expect(result.value.failed).toHaveLength(0);
    }
  });

  it('should return empty result when modules directory is empty', async () => {
    const logger = createLogger();

    const discovery = new ModuleDiscovery({
      modulesDir: '/fake/modules',
      loadConfig: async () => ({}),
      listDir: async () => [],
      isDirectory: async () => true,
      logger,
    });

    const result = await discovery.discover();

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.discovered).toHaveLength(0);
      expect(result.value.skipped).toHaveLength(0);
      expect(result.value.failed).toHaveLength(0);
    }
  });

  it('should handle config load failures gracefully', async () => {
    const logger = createLogger();

    const discovery = new ModuleDiscovery({
      modulesDir: '/fake/modules',
      loadConfig: async () => {
        throw new Error('SyntaxError: unexpected token');
      },
      listDir: async () => ['broken-module'],
      isDirectory: async () => true,
      logger,
    });

    const result = await discovery.discover();

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.discovered).toHaveLength(0);
      expect(result.value.failed).toHaveLength(1);
      expect(result.value.failed[0].error).toContain('SyntaxError');
    }
  });

  it('should skip inactive modules and add name to skipped list', async () => {
    const logger = createLogger();
    const config = createValidConfig({ isActive: false, name: 'inactive-mod' });

    const discovery = new ModuleDiscovery({
      modulesDir: '/fake/modules',
      loadConfig: async () => ({ default: config }),
      listDir: async () => ['inactive-mod'],
      isDirectory: async () => true,
      logger,
    });

    const result = await discovery.discover();

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.discovered).toHaveLength(0);
      expect(result.value.skipped).toContain('inactive-mod');
      expect(result.value.failed).toHaveLength(0);
    }
  });

  it('should add config validation failure to failed list', async () => {
    const logger = createLogger();
    const invalidConfig = { name: '', version: '1.0.0' }; // Missing required fields

    const discovery = new ModuleDiscovery({
      modulesDir: '/fake/modules',
      loadConfig: async () => ({ default: invalidConfig }),
      listDir: async () => ['invalid-module'],
      isDirectory: async () => true,
      logger,
    });

    const result = await discovery.discover();

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.discovered).toHaveLength(0);
      expect(result.value.failed).toHaveLength(1);
      expect(result.value.failed[0].path).toContain('invalid-module');
    }
  });

  it('should discover multiple modules and handle mixed results', async () => {
    const logger = createLogger();
    const validConfig = createValidConfig({ name: 'module-a' });
    const inactiveConfig = createValidConfig({ name: 'module-b', isActive: false });

    let callCount = 0;
    const discovery = new ModuleDiscovery({
      modulesDir: '/fake/modules',
      loadConfig: async () => {
        callCount++;
        if (callCount === 1) return { default: validConfig };
        if (callCount === 2) return { default: inactiveConfig };
        throw new Error('load error');
      },
      listDir: async () => ['module-a', 'module-b', 'module-c'],
      isDirectory: async () => true,
      logger,
    });

    const result = await discovery.discover();

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.discovered).toHaveLength(1);
      expect(result.value.discovered[0].name).toBe('module-a');
      expect(result.value.skipped).toContain('module-b');
      expect(result.value.failed).toHaveLength(1);
    }
  });

  it('should skip non-directory entries', async () => {
    const logger = createLogger();
    const config = createValidConfig({ name: 'real-module' });

    let dirCallCount = 0;
    const discovery = new ModuleDiscovery({
      modulesDir: '/fake/modules',
      loadConfig: async () => ({ default: config }),
      listDir: async () => ['real-module', 'some-file.txt'],
      isDirectory: async (path: string) => {
        dirCallCount++;
        return path.includes('real-module');
      },
      logger,
    });

    const result = await discovery.discover();

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.discovered).toHaveLength(1);
      expect(result.value.discovered[0].name).toBe('real-module');
    }
    expect(dirCallCount).toBe(2);
  });

  it('should use module directory path for discovered module path', async () => {
    const logger = createLogger();
    const config = createValidConfig({ name: 'my-module' });

    const discovery = new ModuleDiscovery({
      modulesDir: '/app/modules',
      loadConfig: async () => ({ default: config }),
      listDir: async () => ['my-module'],
      isDirectory: async () => true,
      logger,
    });

    const result = await discovery.discover();

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.discovered[0].path).toBe('/app/modules/my-module');
    }
  });

  it('should handle config without default export', async () => {
    const logger = createLogger();
    const config = createValidConfig({ name: 'direct-export' });

    const discovery = new ModuleDiscovery({
      modulesDir: '/fake/modules',
      loadConfig: async () => config, // No .default wrapper
      listDir: async () => ['direct-export'],
      isDirectory: async () => true,
      logger,
    });

    const result = await discovery.discover();

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.discovered).toHaveLength(1);
      expect(result.value.discovered[0].name).toBe('direct-export');
    }
  });
});
