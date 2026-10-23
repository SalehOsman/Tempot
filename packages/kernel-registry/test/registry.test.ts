import { describe, it, expect, beforeEach } from 'vitest';
import { KernelRegistry } from '../src/registry.js';
import type { TembotModule } from '../src/manifest.js';

describe('KernelRegistry Specification', () => {
  let registry: KernelRegistry;

  beforeEach(() => {
    registry = new KernelRegistry();
  });

  it('calculates correct DAG topological boot order', () => {
    const modA: TembotModule = {
      manifest: {
        id: 'module-a',
        version: '1.0.0',
        category: 'kernel',
        requires: [],
        capabilities: ['a:read'],
        slices: [],
      },
    };

    const modB: TembotModule = {
      manifest: {
        id: 'module-b',
        version: '1.0.0',
        category: 'domain',
        requires: ['module-a'],
        capabilities: ['b:read'],
        slices: [],
      },
    };

    registry.register(modB);
    registry.register(modA);

    const bootOrderResult = registry.validateDependencyGraph();
    expect(bootOrderResult.isOk()).toBe(true);

    if (bootOrderResult.isOk()) {
      const order = bootOrderResult.value;
      expect(order.indexOf('module-a')).toBeLessThan(order.indexOf('module-b'));
    }
  });

  it('fails fast on cyclic dependencies between modules', () => {
    const modX: TembotModule = {
      manifest: {
        id: 'module-x',
        version: '1.0.0',
        category: 'domain',
        requires: ['module-y'],
        capabilities: [],
        slices: [],
      },
    };

    const modY: TembotModule = {
      manifest: {
        id: 'module-y',
        version: '1.0.0',
        category: 'domain',
        requires: ['module-x'],
        capabilities: [],
        slices: [],
      },
    };

    registry.register(modX);
    registry.register(modY);

    const bootOrderResult = registry.validateDependencyGraph();
    expect(bootOrderResult.isErr()).toBe(true);
    if (bootOrderResult.isErr()) {
      expect(bootOrderResult.error.message).toContain('Cyclic dependency detected');
    }
  });

  it('reports missing prerequisite dependencies', () => {
    const orphanMod: TembotModule = {
      manifest: {
        id: 'orphan',
        version: '1.0.0',
        category: 'domain',
        requires: ['missing-dependency'],
        capabilities: [],
        slices: [],
      },
    };

    registry.register(orphanMod);
    const bootOrderResult = registry.validateDependencyGraph();
    expect(bootOrderResult.isErr()).toBe(true);
    if (bootOrderResult.isErr()) {
      expect(bootOrderResult.error.message).toContain('requires dependency \'missing-dependency\'');
    }
  });
});
