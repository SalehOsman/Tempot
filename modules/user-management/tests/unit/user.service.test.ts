import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ok } from 'neverthrow';
import { UserRepository } from '../../repositories/user.repository.js';
import { UserService } from '../../services/user.service.js';

const VALID_NATIONAL_ID = '28009010100332';

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
});
