import { describe, it, expect } from 'vitest';
import { FEATURE_PACKAGE_MAP, TOGGLE_GUARD_PACKAGES } from '../../src/module-registry.types.js';
import { MODULE_REGISTRY_ERRORS } from '../../src/module-registry.errors.js';

describe('FEATURE_PACKAGE_MAP', () => {
  it('should have all 8 feature-to-package mappings', () => {
    expect(Object.keys(FEATURE_PACKAGE_MAP)).toHaveLength(8);
  });

  it('should map hasNotifications to notifier', () => {
    expect(FEATURE_PACKAGE_MAP.hasNotifications).toBe('notifier');
  });

  it('should map hasAttachments to storage-engine', () => {
    expect(FEATURE_PACKAGE_MAP.hasAttachments).toBe('storage-engine');
  });

  it('should map hasAI to ai-core', () => {
    expect(FEATURE_PACKAGE_MAP.hasAI).toBe('ai-core');
  });

  it('should map hasInputEngine to input-engine', () => {
    expect(FEATURE_PACKAGE_MAP.hasInputEngine).toBe('input-engine');
  });

  it('should map hasImport to import-engine', () => {
    expect(FEATURE_PACKAGE_MAP.hasImport).toBe('import-engine');
  });

  it('should map hasSearch to search-engine', () => {
    expect(FEATURE_PACKAGE_MAP.hasSearch).toBe('search-engine');
  });

  it('should map hasDynamicCMS to cms-engine', () => {
    expect(FEATURE_PACKAGE_MAP.hasDynamicCMS).toBe('cms-engine');
  });

  it('should map hasRegional to regional-engine', () => {
    expect(FEATURE_PACKAGE_MAP.hasRegional).toBe('regional-engine');
  });
});

describe('TOGGLE_GUARD_PACKAGES', () => {
  it('should have 19 toggle guard entries', () => {
    expect(Object.keys(TOGGLE_GUARD_PACKAGES)).toHaveLength(19);
  });

  it('should map auth-core to TEMPOT_AUTH with default true', () => {
    expect(TOGGLE_GUARD_PACKAGES['auth-core']).toEqual({
      envVar: 'TEMPOT_AUTH',
      defaultEnabled: true,
    });
  });

  it('should map cms-engine to TEMPOT_DYNAMIC_CMS with default false', () => {
    expect(TOGGLE_GUARD_PACKAGES['cms-engine']).toEqual({
      envVar: 'TEMPOT_DYNAMIC_CMS',
      defaultEnabled: false,
    });
  });

  it('should map sentry to TEMPOT_SENTRY with default false', () => {
    expect(TOGGLE_GUARD_PACKAGES['sentry']).toEqual({
      envVar: 'TEMPOT_SENTRY',
      defaultEnabled: false,
    });
  });
});

describe('MODULE_REGISTRY_ERRORS', () => {
  it('should have 12 error codes', () => {
    expect(Object.keys(MODULE_REGISTRY_ERRORS)).toHaveLength(12);
  });

  it('should follow module-registry.{category}.{detail} pattern', () => {
    const values = Object.values(MODULE_REGISTRY_ERRORS);
    for (const code of values) {
      expect(code).toMatch(/^module-registry\.\w+\.\w+$/);
    }
  });

  it('should include DISCOVERY_FAILED', () => {
    expect(MODULE_REGISTRY_ERRORS.DISCOVERY_FAILED).toBe('module-registry.discovery.failed');
  });

  it('should include CORE_MODULE_FAILED', () => {
    expect(MODULE_REGISTRY_ERRORS.CORE_MODULE_FAILED).toBe(
      'module-registry.core.validation_failed',
    );
  });

  it('should include NOT_DISCOVERED', () => {
    expect(MODULE_REGISTRY_ERRORS.NOT_DISCOVERED).toBe('module-registry.state.not_discovered');
  });

  it('should include NOT_VALIDATED', () => {
    expect(MODULE_REGISTRY_ERRORS.NOT_VALIDATED).toBe('module-registry.state.not_validated');
  });
});
