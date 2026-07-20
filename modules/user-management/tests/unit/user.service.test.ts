import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ok } from 'neverthrow';
import { RoleEnum } from '@tempot/auth-core';
import { UserRepository } from '../../repositories/user.repository.js';
import { UserService } from '../../services/user.service.js';
import type { UserProfile } from '../../types/index.js';

const VALID_NATIONAL_ID = '28009010100332';
const now = new Date('2026-06-17T00:00:00.000Z');

function userProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'user-1',
    telegramId: '123456789',
    username: 'saleh',
    email: 'saleh@example.com',
    language: 'ar',
    role: RoleEnum.USER,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('UserService identity updates', () => {
  const updateIdentity = vi.fn().mockResolvedValue(ok(undefined));
  let originalUpdateIdentity: PropertyDescriptor | undefined;

  beforeEach(() => {
    originalUpdateIdentity = Object.getOwnPropertyDescriptor(
      UserRepository.prototype,
      'updateIdentity',
    );
    Object.defineProperty(UserRepository.prototype, 'updateIdentity', {
      configurable: true,
      value: updateIdentity,
    });

    vi.spyOn(UserRepository.prototype, 'updateNationalId').mockResolvedValue(ok(undefined));
    vi.spyOn(UserRepository.prototype, 'updateBirthDate').mockResolvedValue(ok(undefined));
    vi.spyOn(UserRepository.prototype, 'updateGender').mockResolvedValue(ok(undefined));
    vi.spyOn(UserRepository.prototype, 'updateGovernorate').mockResolvedValue(ok(undefined));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    updateIdentity.mockClear();

    if (originalUpdateIdentity) {
      Object.defineProperty(UserRepository.prototype, 'updateIdentity', originalUpdateIdentity);
    } else {
      Reflect.deleteProperty(UserRepository.prototype, 'updateIdentity');
    }
  });

  it('persists a national ID and all derived fields through one repository operation', async () => {
    const service = new UserService({ log: vi.fn().mockResolvedValue(undefined) });

    const result = await service.updateNationalId('user-1', VALID_NATIONAL_ID);

    expect(result.isOk()).toBe(true);
    expect(updateIdentity).toHaveBeenCalledOnce();
    expect(updateIdentity).toHaveBeenCalledWith('user-1', {
      nationalId: VALID_NATIONAL_ID,
      gender: 'male',
      birthDate: new Date(1980, 8, 1),
      governorate: 'eg.governorates.cairo',
    });
    expect(UserRepository.prototype.updateNationalId).not.toHaveBeenCalled();
    expect(UserRepository.prototype.updateBirthDate).not.toHaveBeenCalled();
    expect(UserRepository.prototype.updateGender).not.toHaveBeenCalled();
    expect(UserRepository.prototype.updateGovernorate).not.toHaveBeenCalled();
  });

  it('persists derived fields from an existing national ID through one repository operation', async () => {
    const service = new UserService({ log: vi.fn().mockResolvedValue(undefined) });

    const result = await service.extractFromExistingNationalId('user-1', VALID_NATIONAL_ID);

    expect(result.isOk()).toBe(true);
    expect(updateIdentity).toHaveBeenCalledOnce();
    expect(updateIdentity).toHaveBeenCalledWith('user-1', {
      gender: 'male',
      birthDate: new Date(1980, 8, 1),
      governorate: 'eg.governorates.cairo',
    });
    expect(UserRepository.prototype.updateBirthDate).not.toHaveBeenCalled();
    expect(UserRepository.prototype.updateGender).not.toHaveBeenCalled();
    expect(UserRepository.prototype.updateGovernorate).not.toHaveBeenCalled();
  });

  it('caches Telegram lookups and invalidates the cached entry after username updates', async () => {
    vi.spyOn(UserRepository.prototype, 'findByTelegramId').mockResolvedValue(ok(userProfile()));
    vi.spyOn(UserRepository.prototype, 'updateUsername').mockResolvedValue(ok(undefined));
    const service = new UserService({ log: vi.fn().mockResolvedValue(undefined) });

    await expect(service.getByTelegramId('123456789')).resolves.toEqual(ok(userProfile()));
    await expect(service.getByTelegramId('123456789')).resolves.toEqual(ok(userProfile()));
    await expect(service.updateUsername('user-1', 'new-name')).resolves.toEqual(ok(undefined));
    await expect(service.getByTelegramId('123456789')).resolves.toEqual(ok(userProfile()));

    expect(UserRepository.prototype.findByTelegramId).toHaveBeenCalledTimes(2);
    expect(UserRepository.prototype.updateUsername).toHaveBeenCalledWith('user-1', 'new-name');
  });

  it('loads users by id and stores the returned profile in the Telegram cache', async () => {
    vi.spyOn(UserRepository.prototype, 'findById').mockResolvedValue(ok(userProfile()));
    vi.spyOn(UserRepository.prototype, 'findByTelegramId').mockResolvedValue(
      ok(userProfile({ username: 'from-repository' })),
    );
    const service = new UserService({ log: vi.fn().mockResolvedValue(undefined) });

    await expect(service.getById('user-1')).resolves.toEqual(ok(userProfile()));
    await expect(service.getByTelegramId('123456789')).resolves.toEqual(ok(userProfile()));

    expect(UserRepository.prototype.findByTelegramId).not.toHaveBeenCalled();
  });

  it('maps repository search results to user arrays', async () => {
    vi.spyOn(UserRepository.prototype, 'search').mockResolvedValue(
      ok({ users: [userProfile()], totalCount: 1, page: 0, pageSize: 10 }),
    );
    const service = new UserService({ log: vi.fn().mockResolvedValue(undefined) });

    await expect(service.searchUsers('saleh')).resolves.toEqual(ok([userProfile()]));

    expect(UserRepository.prototype.search).toHaveBeenCalledWith('saleh', 0, 10);
  });

  it('delegates basic profile updates to the repository', async () => {
    vi.spyOn(UserRepository.prototype, 'updateEmail').mockResolvedValue(ok(undefined));
    vi.spyOn(UserRepository.prototype, 'updateLanguage').mockResolvedValue(ok(undefined));
    vi.spyOn(UserRepository.prototype, 'updateRole').mockResolvedValue(ok(undefined));
    vi.spyOn(UserRepository.prototype, 'findById').mockResolvedValue(ok(userProfile()));
    const service = new UserService({ log: vi.fn().mockResolvedValue(undefined) });

    await expect(service.updateEmail('user-1', 'new@example.com')).resolves.toEqual(ok(undefined));
    await expect(service.updateLanguage('user-1', 'en')).resolves.toEqual(ok(undefined));
    await expect(service.updateRole('user-1', RoleEnum.ADMIN)).resolves.toEqual(ok(undefined));

    expect(UserRepository.prototype.updateEmail).toHaveBeenCalledWith('user-1', 'new@example.com');
    expect(UserRepository.prototype.updateLanguage).toHaveBeenCalledWith('user-1', 'en');
    expect(UserRepository.prototype.updateRole).toHaveBeenCalledWith('user-1', RoleEnum.ADMIN);
  });

  it('blocks demoting the last active super admin', async () => {
    vi.spyOn(UserRepository.prototype, 'findById').mockResolvedValue(
      ok(userProfile({ role: RoleEnum.SUPER_ADMIN })),
    );
    vi.spyOn(UserRepository.prototype, 'countActiveSuperAdmins').mockResolvedValue(ok(1));
    vi.spyOn(UserRepository.prototype, 'updateRole').mockResolvedValue(ok(undefined));
    const service = new UserService({ log: vi.fn().mockResolvedValue(undefined) });

    const result = await service.updateRole('user-1', RoleEnum.ADMIN);

    expect(result.isErr()).toBe(true);
    if (result.isOk()) return;
    expect(result.error.code).toBe('user-management.users.role.last_super_admin');
    expect(UserRepository.prototype.updateRole).not.toHaveBeenCalled();
  });

  it('delegates regional profile updates to the repository', async () => {
    vi.spyOn(UserRepository.prototype, 'updateMobileNumber').mockResolvedValue(ok(undefined));
    vi.spyOn(UserRepository.prototype, 'updateCountryCode').mockResolvedValue(ok(undefined));
    const service = new UserService({ log: vi.fn().mockResolvedValue(undefined) });
    const birthDate = new Date('1990-01-01T00:00:00.000Z');

    await expect(service.updateMobileNumber('user-1', '+201001234567')).resolves.toEqual(
      ok(undefined),
    );
    await expect(service.updateBirthDate('user-1', birthDate)).resolves.toEqual(ok(undefined));
    await expect(service.updateGender('user-1', 'male')).resolves.toEqual(ok(undefined));
    await expect(service.updateGovernorate('user-1', 'eg.governorates.cairo')).resolves.toEqual(
      ok(undefined),
    );
    await expect(service.updateCountryCode('user-1', '+20')).resolves.toEqual(ok(undefined));

    expect(UserRepository.prototype.updateMobileNumber).toHaveBeenCalledWith(
      'user-1',
      '+201001234567',
    );
    expect(UserRepository.prototype.updateBirthDate).toHaveBeenCalledWith('user-1', birthDate);
    expect(UserRepository.prototype.updateGender).toHaveBeenCalledWith('user-1', 'male');
    expect(UserRepository.prototype.updateGovernorate).toHaveBeenCalledWith(
      'user-1',
      'eg.governorates.cairo',
    );
    expect(UserRepository.prototype.updateCountryCode).toHaveBeenCalledWith('user-1', '+20');
  });

  it('stores non-Egyptian national IDs without deriving identity fields', async () => {
    const service = new UserService({ log: vi.fn().mockResolvedValue(undefined) });

    const result = await service.updateNationalId('user-1', 'AB123456', '+966');

    expect(result).toEqual(ok({ extracted: false }));
    expect(UserRepository.prototype.updateNationalId).toHaveBeenCalledWith('user-1', 'AB123456');
    expect(updateIdentity).not.toHaveBeenCalled();
  });

  it('returns null extraction when the existing national ID is invalid', async () => {
    const service = new UserService({ log: vi.fn().mockResolvedValue(undefined) });

    const result = await service.extractFromExistingNationalId('user-1', '123');

    expect(result).toEqual(ok(null));
    expect(updateIdentity).not.toHaveBeenCalled();
  });

  it('can invalidate cached Telegram profiles explicitly', async () => {
    vi.spyOn(UserRepository.prototype, 'findByTelegramId').mockResolvedValue(ok(userProfile()));
    const service = new UserService({ log: vi.fn().mockResolvedValue(undefined) });

    await service.getByTelegramId('123456789');
    service.invalidateCacheByTelegramId('123456789');
    await service.getByTelegramId('123456789');

    expect(UserRepository.prototype.findByTelegramId).toHaveBeenCalledTimes(2);
  });
});
