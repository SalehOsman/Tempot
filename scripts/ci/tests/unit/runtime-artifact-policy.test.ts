import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const dockerfilePath = join(process.cwd(), 'apps', 'bot-server', 'Dockerfile');
const dockerWorkflowPath = join(process.cwd(), '.github', 'workflows', 'docker.yml');

function runnerStage(dockerfile: string): string {
  const marker = '# Stage: runner';
  const start = dockerfile.indexOf(marker);

  expect(start).toBeGreaterThanOrEqual(0);

  return dockerfile.slice(start);
}

describe('runtime artifact policy', () => {
  it('keeps source, tests, and SpecKit trees out of the bot runner image', () => {
    const dockerfile = readFileSync(dockerfilePath, 'utf8');
    const runner = runnerStage(dockerfile);

    expect(runner).not.toMatch(/COPY --from=builder \/app\/specs\b/u);
    expect(runner).not.toMatch(/COPY --from=builder \/app\/modules\b/u);
    expect(runner).not.toMatch(/COPY --from=builder \/app\/packages\b/u);
    expect(runner).toContain('runtime-manifest.json');
    expect(runner).toMatch(/^USER hono$/mu);
  });

  it('generates the runtime manifest during the bot runtime build', () => {
    const dockerfile = readFileSync(dockerfilePath, 'utf8');

    expect(dockerfile).toContain('pnpm runtime:manifest');
    expect(dockerfile).toContain('/app/runtime/runtime-manifest.json');
    expect(dockerfile).toContain("find /app/runtime -path '*/tests*'");
    expect(dockerfile).toContain("find /app/runtime -name '*.d.ts'");
    expect(dockerfile).toContain("find /app/runtime -name '*.map'");
    expect(dockerfile).not.toContain('cp -R "$dir/database" "/app/runtime/modules');
  });

  it('builds images with supply-chain evidence and blocking scan/signature gates', () => {
    const workflow = readFileSync(dockerWorkflowPath, 'utf8');

    expect(workflow).toContain('sbom: true');
    expect(workflow).toContain('provenance: true');
    expect(workflow).toContain('aquasecurity/trivy-action');
    expect(workflow).toContain('cosign sign');
    expect(workflow).toContain('cosign verify');
  });
});
