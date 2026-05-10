import { describe, expect, it } from 'vitest';
import * as path from 'node:path';

import { discoverSpecDirs, resolveRoadmapPath } from '../../index.js';
import { PROJECT_ROOT } from '../../types.js';

describe('spec-validate deferred packages', () => {
  it('should include activated engine package specs in all-package validation', () => {
    const packageNames = discoverSpecDirs();

    expect(packageNames).toContain('008-cms-engine-package');
    expect(packageNames).toContain('013-notifier-package');
    expect(packageNames).toContain('014-search-engine-package');
    expect(packageNames).toContain('016-document-engine-package');
    expect(packageNames).toContain('017-import-engine-package');
  });

  it('should resolve the canonical roadmap before the archive compatibility path', () => {
    expect(resolveRoadmapPath()).toBe(path.join(PROJECT_ROOT, 'docs', 'ROADMAP.md'));
  });
});
