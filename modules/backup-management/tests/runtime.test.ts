import { describe, expect, it, vi } from 'vitest';
import setup from '../index.js';
import config from '../module.config.js';

describe('backup-management runtime setup', () => {
  it('should register command and callback handlers', async () => {
    const bot = {
      command: vi.fn(),
      on: vi.fn(),
    };
    const deps = {
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
        child: vi.fn(),
      },
      i18n: { t: (key: string) => key },
      authorization: {
        guard: vi.fn(() => vi.fn()),
        enforce: vi.fn(),
      },
      config,
    };

    await setup(bot as unknown as Parameters<typeof setup>[0], deps);

    expect(bot.command).toHaveBeenCalledWith('backups', expect.any(Function), expect.any(Function));
    expect(bot.on).toHaveBeenCalledWith('callback_query:data', expect.any(Function));
  });
});
