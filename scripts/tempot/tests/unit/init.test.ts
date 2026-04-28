import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseTempotArgs } from '../../doctor.presenter.js';
import { renderInitResult } from '../../init.presenter.js';
import { initializeTempotProject } from '../../init.writer.js';

describe('Tempot init command', () => {
  it('should parse the init command', () => {
    expect(parseTempotArgs(['init'])).toEqual({
      command: 'init',
    });
  });

  it('should create .env from .env.example without overwriting an existing .env', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'tempot-init-'));

    try {
      await writeFile(join(cwd, '.env.example'), 'BOT_TOKEN=\nDATABASE_URL=postgresql://example\n');

      const first = await initializeTempotProject({ cwd });

      expect(first).toEqual({
        ok: true,
        createdEnvFile: true,
        skippedExistingEnvFile: false,
      });
      await expect(readFile(join(cwd, '.env'), 'utf8')).resolves.toContain(
        'DATABASE_URL=postgresql://example',
      );

      await writeFile(join(cwd, '.env'), 'BOT_TOKEN=existing-token\n');

      const second = await initializeTempotProject({ cwd });

      expect(second).toEqual({
        ok: true,
        createdEnvFile: false,
        skippedExistingEnvFile: true,
      });
      await expect(readFile(join(cwd, '.env'), 'utf8')).resolves.toBe('BOT_TOKEN=existing-token\n');
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });

  it('should report a missing .env.example as a blocking initialization failure', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'tempot-init-missing-example-'));

    try {
      const result = await initializeTempotProject({ cwd });

      expect(result).toEqual({
        ok: false,
        error: 'Missing .env.example. Run this command from the Tempot repository root.',
      });
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });

  it('should render initialization results without secret values', () => {
    const output = renderInitResult({
      ok: true,
      createdEnvFile: true,
      skippedExistingEnvFile: false,
    });

    expect(output).toContain('Tempot Init');
    expect(output).toContain('[pass] Created .env from .env.example');
    expect(output).toContain('pnpm tempot doctor --quick');
    expect(output).not.toContain('BOT_TOKEN=');
    expect(output).not.toContain('TELEGRAM_TOKEN=');
  });
});
