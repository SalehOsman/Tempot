import { describe, expect, it } from 'vitest';
import { moduleManifest } from '../module.manifest.js';

describe('content-management module manifest', () => {
  it('should describe the starter module metadata', () => {
    expect(moduleManifest.name).toBe('content-management');
    expect(moduleManifest.type).toBe('product');
    expect(moduleManifest.blueprint).toBe('basic');
    expect(moduleManifest.status).toBe('active');
  });
});
