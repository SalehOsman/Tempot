import { describe, expect, it, vi } from 'vitest';
import { saveProfileSession } from '../../services/session-language-sync.service.js';
import type { ModuleSessionRecord } from '../../types/module-deps.types.js';

const baseSession: ModuleSessionRecord = {
  userId: '123456789',
  chatId: '123456789',
  role: 'USER',
  status: 'ACTIVE',
  language: 'en',
  activeConversation: null,
  metadata: null,
  schemaVersion: 1,
  version: 1,
  createdAt: new Date('2026-07-23T00:00:00.000Z'),
  updatedAt: new Date('2026-07-23T00:00:00.000Z'),
};

describe('saveProfileSession', () => {
  it('should preserve the persisted user status when syncing profile sessions', async () => {
    const saveSession = vi.fn().mockResolvedValue({ isOk: () => true });
    const sessionProvider = {
      getSession: vi.fn().mockResolvedValue(baseSession),
      saveSession,
    };

    await saveProfileSession({
      sessionProvider,
      user: {
        telegramId: '123456789',
        role: 'USER',
        status: 'BANNED',
        language: 'en',
      },
    });

    expect(saveSession).toHaveBeenCalledWith(expect.objectContaining({ status: 'BANNED' }));
  });
});
