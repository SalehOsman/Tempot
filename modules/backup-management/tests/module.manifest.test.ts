import { describe, expect, it } from 'vitest';
import { moduleManifest } from '../module.manifest.js';

describe('backup-management module manifest', () => {
  it('should describe backup operational capabilities', () => {
    expect(moduleManifest.name).toBe('backup-management');
    expect(moduleManifest.type).toBe('operations');
    expect(moduleManifest.status).toBe('active');
    expect(moduleManifest.capabilities).toContain('restore-rehearsal');
  });
});
