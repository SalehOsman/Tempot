import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('bot-server Dockerfile', () => {
  it('should pin PostgreSQL client tools to the database major version', async () => {
    const dockerfile = await readFile(new URL('../../Dockerfile', import.meta.url), 'utf8');

    expect(dockerfile).toContain('postgresql16-client');
    expect(dockerfile).not.toContain(' postgresql-client');
  });
});
