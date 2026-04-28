import { describe, expect, it } from 'vitest';
import config from '../../../../vitest.config.js';

describe('Vitest CI configuration', () => {
  it('should run integration test files sequentially to avoid shared database schema races', () => {
    const projects = config.test?.projects ?? [];
    const integrationProject = projects.find((project) => project.test?.name === 'integration');

    expect(integrationProject?.test?.fileParallelism).toBe(false);
  });
});
