import { describe, expect, it } from 'vitest';
import { moduleManifest } from '../module.manifest.js';

describe('notification-center module manifest', () => {
  it('should describe the starter module metadata', () => {
    expect(moduleManifest.name).toBe('notification-center');
    expect(moduleManifest.type).toBe('operational');
    expect(moduleManifest.blueprint).toBe('basic');
    expect(moduleManifest.status).toBe('active');
  });
});
