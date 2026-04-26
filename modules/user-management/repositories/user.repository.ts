/**
 * UserRepository — قاعدة بيانات المستخدمين
 */

import { BaseRepository } from '@tempot/database';
import { AppError } from '@tempot/shared';
import { ok, err, type Result } from 'neverthrow';
import { RoleEnum } from '@tempot/auth-core';
import type { UserProfile, UserSearchResult } from '../types/index.js';

export class UserRepository extends BaseRepository<UserProfile> {
  protected moduleName = 'user-management';
  protected entityName = 'userProfile';

  protected get model() {
    return this.db.userProfile;
  }

  async findByTelegramId(telegramId: string): Promise<Result<UserProfile, AppError>> {
    const result = await this.findMany({ telegramId });
    if (result.isErr()) return err(result.error);

    const user = result.value[0];
    if (!user) return err(new AppError('user-management.not_found', { telegramId }));

    return ok(user);
  }

  async search(query: string, page: number = 0, pageSize: number = 10): Promise<Result<UserSearchResult, AppError>> {
    const where =
      query.trim().length > 0
        ? { OR: [
            { username: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ] }
        : {};

    const usersResult = await this.findMany({ where, skip: page * pageSize, take: pageSize });
    if (usersResult.isErr()) return err(usersResult.error);

    const allResult = await this.findMany({ where });
    if (allResult.isErr()) return err(allResult.error);

    return ok({ users: usersResult.value, totalCount: allResult.value.length, page, pageSize });
  }

  // ─── Update — أساسية ─────────────────────────────────────────────────────────

  async updateUsername(userId: string, newUsername: string): Promise<Result<void, AppError>> {
    const result = await this.update(userId, { username: newUsername });
    return result.isErr() ? err(result.error) : ok(undefined);
  }

  async updateEmail(userId: string, newEmail: string): Promise<Result<void, AppError>> {
    const result = await this.update(userId, { email: newEmail });
    return result.isErr() ? err(result.error) : ok(undefined);
  }

  async updateLanguage(userId: string, newLanguage: string): Promise<Result<void, AppError>> {
    const result = await this.update(userId, { language: newLanguage });
    return result.isErr() ? err(result.error) : ok(undefined);
  }

  async updateRole(userId: string, newRole: RoleEnum): Promise<Result<void, AppError>> {
    const result = await this.update(userId, { role: newRole });
    return result.isErr() ? err(result.error) : ok(undefined);
  }

  // ─── Update — مصرية ──────────────────────────────────────────────────────────

  async updateNationalId(userId: string, nationalId: string): Promise<Result<void, AppError>> {
    const result = await this.update(userId, { nationalId });
    return result.isErr() ? err(result.error) : ok(undefined);
  }

  async updateMobileNumber(userId: string, mobileNumber: string): Promise<Result<void, AppError>> {
    const result = await this.update(userId, { mobileNumber });
    return result.isErr() ? err(result.error) : ok(undefined);
  }

  async updateBirthDate(userId: string, birthDate: Date): Promise<Result<void, AppError>> {
    const result = await this.update(userId, { birthDate });
    return result.isErr() ? err(result.error) : ok(undefined);
  }

  async updateGender(userId: string, gender: 'male' | 'female'): Promise<Result<void, AppError>> {
    const result = await this.update(userId, { gender });
    return result.isErr() ? err(result.error) : ok(undefined);
  }

  async updateGovernorate(userId: string, governorate: string): Promise<Result<void, AppError>> {
    const result = await this.update(userId, { governorate });
    return result.isErr() ? err(result.error) : ok(undefined);
  }

  async updateCountryCode(userId: string, countryCode: string): Promise<Result<void, AppError>> {
    const result = await this.update(userId, { countryCode });
    return result.isErr() ? err(result.error) : ok(undefined);
  }
}
