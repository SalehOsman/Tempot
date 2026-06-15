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

  it('should include nested application tests without duplicating classified test projects', () => {
    const projects = config.test?.projects ?? [];
    const applicationProject = projects.find((project) => project.test?.name === 'application');

    expect(applicationProject?.test?.include).toContain('modules/*/tests/**/*.test.ts');
    expect(applicationProject?.test?.exclude).toEqual(
      expect.arrayContaining(['**/tests/unit/**', '**/tests/integration/**', '**/tests/e2e/**']),
    );
  });

  it('should collect coverage from modules that keep source files at the module root', () => {
    expect(config.test?.coverage?.include).toContain('modules/*/**/*.ts');
    expect(config.test?.coverage?.exclude).toContain('modules/*/tests/**');
  });

  it('should not execute a test file twice through duplicate include patterns', () => {
    const projects = config.test?.projects ?? [];

    for (const project of projects) {
      const include = project.test?.include ?? [];
      expect(new Set(include).size, project.test?.name).toBe(include.length);
    }
  });
});
