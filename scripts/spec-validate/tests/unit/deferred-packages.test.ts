import { describe, expect, it } from 'vitest';
import { discoverSpecDirs } from '../../index.js';

describe('spec-validate deferred packages', () => {
  it('should exclude roadmap-deferred packages from all-package validation', () => {
    const packageNames = discoverSpecDirs();

    expect(packageNames).not.toContain('008-cms-engine-package');
    expect(packageNames).toContain('013-notifier-package');
    expect(packageNames).not.toContain('014-search-engine-package');
    expect(packageNames).not.toContain('016-document-engine-package');
    expect(packageNames).not.toContain('017-import-engine-package');
  });
});
