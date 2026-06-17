import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RoleEnum } from '@tempot/auth-core';
import { ok } from 'neverthrow';
import { RoleService } from '../../services/role.service.js';
import { UserRepository } from '../../repositories/user.repository.js';

describe('RoleService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Reflect.set(RoleService, 'repository', null);
  });

  it('returns repository role update results', async () => {
    vi.spyOn(UserRepository.prototype, 'updateRole').mockResolvedValue(ok(undefined));

    const result = await RoleService.changeRole('user-1', RoleEnum.ADMIN);

    expect(result.isOk()).toBe(true);
    expect(UserRepository.prototype.updateRole).toHaveBeenCalledWith('user-1', RoleEnum.ADMIN);
  });

  it('returns an error result when role persistence throws', async () => {
    vi.spyOn(UserRepository.prototype, 'updateRole').mockRejectedValue(new Error('db offline'));

    const result = await RoleService.changeRole('user-1', RoleEnum.ADMIN);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('user-management.role_change_failed');
  });
});
