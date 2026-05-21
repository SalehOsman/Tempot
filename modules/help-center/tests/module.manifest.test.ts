import { describe, expect, it } from 'vitest';
import { moduleManifest } from '../module.manifest.js';

describe('help-center module manifest', () => {
  it('should describe the starter module metadata', () => {
    expect(moduleManifest.name).toBe('help-center');
    expect(moduleManifest.type).toBe('core-platform');
    expect(moduleManifest.blueprint).toBe('basic');
    expect(moduleManifest.status).toBe('active');
  });
});
