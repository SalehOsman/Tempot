import { RoleEnum } from '@tempot/auth-core';
import { ok } from 'neverthrow';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UserRepository } from '../../repositories/user.repository.js';
import { UserService } from '../../services/user.service.js';
import type { UserProfile } from '../../types/index.js';

function userProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'user-1',
    telegramId: '123456789',
    username: 'saleh',
    language: 'en',
    role: RoleEnum.USER,
    status: 'ACTIVE',
    createdAt: new Date('2026-07-23T00:00:00.000Z'),
    updatedAt: new Date('2026-07-23T00:00:00.000Z'),
    ...overrides,
  };
}

describe('UserService status updates', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should block users through the repository status boundary', async () => {
    vi.spyOn(UserRepository.prototype, 'findById').mockResolvedValue(ok(userProfile()));
    vi.spyOn(UserRepository.prototype, 'updateStatus').mockResolvedValue(ok(undefined));
    const service = new UserService({ log: vi.fn().mockResolvedValue(undefined) });

    const result = await service.blockUser('user-1');

    expect(result).toEqual(ok(undefined));
    expect(UserRepository.prototype.updateStatus).toHaveBeenCalledWith('user-1', 'BANNED');
  });

  it('should unblock users through the repository status boundary', async () => {
    vi.spyOn(UserRepository.prototype, 'updateStatus').mockResolvedValue(ok(undefined));
    const service = new UserService({ log: vi.fn().mockResolvedValue(undefined) });

    const result = await service.unblockUser('user-1');

    expect(result).toEqual(ok(undefined));
    expect(UserRepository.prototype.updateStatus).toHaveBeenCalledWith('user-1', 'ACTIVE');
  });

  it('should prevent blocking the last active super admin', async () => {
    vi.spyOn(UserRepository.prototype, 'findById').mockResolvedValue(
      ok(userProfile({ role: RoleEnum.SUPER_ADMIN })),
    );
    vi.spyOn(UserRepository.prototype, 'countActiveSuperAdmins').mockResolvedValue(ok(1));
    vi.spyOn(UserRepository.prototype, 'updateStatus').mockResolvedValue(ok(undefined));
    const service = new UserService({ log: vi.fn().mockResolvedValue(undefined) });

    const result = await service.blockUser('user-1');

    expect(result.isErr()).toBe(true);
    if (result.isOk()) return;
    expect(result.error.code).toBe('user-management.users.role.last_super_admin');
    expect(UserRepository.prototype.updateStatus).not.toHaveBeenCalled();
  });
});
