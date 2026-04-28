import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const CI_WORKFLOW_PATH = join(process.cwd(), '.github', 'workflows', 'ci.yml');

describe('CI workflow quality gates', () => {
  it('should run Tempot CLI smoke checks in methodology gates', () => {
    const workflow = readFileSync(CI_WORKFLOW_PATH, 'utf8');

    expect(workflow).toContain('pnpm tempot init');
    expect(workflow).toContain('pnpm tempot doctor --quick');
  });
});
