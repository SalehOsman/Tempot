import { describe, expect, it } from 'vitest';
import config from '../../../../vitest.config.js';

describe('Vitest CI configuration', () => {
  it('should give unit tests enough timeout for cold imports under CI load', () => {
    const projects = config.test?.projects ?? [];
    const unitProject = projects.find((project) => project.test?.name === 'unit');

    expect(unitProject?.test?.testTimeout).toBe(120_000);
    expect(unitProject?.test?.hookTimeout).toBe(120_000);
  });

  it('should run integration test files sequentially to avoid shared database schema races', () => {
    const projects = config.test?.projects ?? [];
    const integrationProject = projects.find((project) => project.test?.name === 'integration');

    expect(integrationProject?.test?.fileParallelism).toBe(false);
  });
});
