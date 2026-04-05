import { describe, it, expect } from 'vitest';
import { moduleConfigSchema } from '../../src/module-config.schema.js';
import type { ModuleConfig } from '../../src/module-registry.types.js';

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

function omit<T extends Record<string, unknown>>(obj: T, key: string): Record<string, unknown> {
  const copy = { ...obj };
  delete copy[key];
  return copy;
}

describe('moduleConfigSchema', () => {
  it('should pass with all mandatory fields valid', () => {
    const config = createValidConfig();
    const result = moduleConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  it('should fail when name is missing', () => {
    const config = createValidConfig();
    const result = moduleConfigSchema.safeParse(omit(config, 'name'));
    expect(result.success).toBe(false);
  });

  it('should fail when version is missing', () => {
    const config = createValidConfig();
    const result = moduleConfigSchema.safeParse(omit(config, 'version'));
    expect(result.success).toBe(false);
  });

  it('should fail when name is empty string', () => {
    const config = createValidConfig({ name: '' });
    const result = moduleConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it('should fail with invalid requiredRole', () => {
    const config = { ...createValidConfig(), requiredRole: 'MODERATOR' };
    const result = moduleConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it('should fail when hasAI is true without aiDegradationMode', () => {
    const config = createValidConfig({
      features: {
        ...createValidConfig().features,
        hasAI: true,
      },
    });
    const result = moduleConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it('should pass when hasAI is true with valid aiDegradationMode', () => {
    const config = createValidConfig({
      features: {
        ...createValidConfig().features,
        hasAI: true,
      },
      aiDegradationMode: 'graceful',
    });
    const result = moduleConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  it('should pass when hasAI is false without aiDegradationMode', () => {
    const config = createValidConfig();
    const result = moduleConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  it('should fail with invalid aiDegradationMode value', () => {
    const config = {
      ...createValidConfig(),
      aiDegradationMode: 'restart',
    };
    const result = moduleConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it('should pass with scopedUsers as number array', () => {
    const config = createValidConfig({ scopedUsers: [123, 456] });
    const result = moduleConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  it('should fail with scopedUsers containing non-numbers', () => {
    const config = { ...createValidConfig(), scopedUsers: ['abc'] };
    const result = moduleConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it('should pass with valid commands array', () => {
    const config = createValidConfig({
      commands: [
        { command: 'start', description: 'Start the bot' },
        { command: 'help', description: 'Show help' },
      ],
    });
    const result = moduleConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  it('should fail when command has missing command field', () => {
    const config = {
      ...createValidConfig(),
      commands: [{ description: 'Missing command' }],
    };
    const result = moduleConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it('should fail when any feature flag is missing', () => {
    const config = createValidConfig();
    const broken = {
      ...config,
      features: omit(config.features, 'hasDatabase'),
    };
    const result = moduleConfigSchema.safeParse(broken);
    expect(result.success).toBe(false);
  });

  it('should pass with empty commands array', () => {
    const config = createValidConfig({ commands: [] });
    const result = moduleConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  it('should pass with requires.packages and requires.optional', () => {
    const config = createValidConfig({
      requires: { packages: ['shared', 'logger'], optional: ['ai-core'] },
    });
    const result = moduleConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });
});
