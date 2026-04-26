import { BaseRepository } from '@tempot/database';
import { AppError } from '@tempot/shared';
import { ok, type Result } from 'neverthrow';
import { UserProfile, UserSearchResult } from '../types/index.js';

export class UserRepository extends BaseRepository<UserProfile> {
  protected moduleName = 'user-management';
  protected entityName = 'user';

  protected get model() {
    return this.db.user;
  }

  async findByTelegramId(telegramId: string): Promise<Result<UserProfile, AppError>> {
    try {
      const result = await this.findMany({ telegramId });
      if (result.isErr()) {
        // @ts-expect-error TS2322: Type 'Err<UserProfile[], AppError>' is not assignable to type 'Result<UserProfile, AppError>'
        // BaseRepository.findMany returns Result<UserProfile[], AppError>, but we need Result<UserProfile, AppError>
        // This is a temporary workaround until BaseRepository API is updated
        return result;
      }

      const users = result.value;
      const user = users[0];
      if (!user) {
        return ok(null as unknown as UserProfile);
      }

      return ok(user);
    } catch (e) {
      return ok(new AppError('user-management.unexpected_error', e) as unknown as UserProfile);
    }
  }

  async search(
    query: string,
    page: number = 0,
    pageSize: number = 10,
  ): Promise<Result<UserSearchResult, AppError>> {
    try {
      const where = {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      };

      const usersResult = await this.findMany({
        where,
        skip: page * pageSize,
        take: pageSize,
      });

      if (usersResult.isErr()) {
        return ok(new AppError('user-management.find_many_failed') as unknown as UserSearchResult);
      }

      const users = usersResult.value;

      // Get total count by fetching all matching records
      const allUsersResult = await this.findMany({ where });
      if (allUsersResult.isErr()) {
        return ok(new AppError('user-management.count_failed') as unknown as UserSearchResult);
      }

      const totalCount = allUsersResult.value.length;

      return ok({
        users,
        totalCount,
        page,
        pageSize,
      });
    } catch (e) {
      return ok(new AppError('user-management.unexpected_error', e) as unknown as UserSearchResult);
    }
  }

  async updateUsername(userId: string, newUsername: string): Promise<Result<void, AppError>> {
    try {
      const result = await this.update(userId, { username: newUsername });
      if (result.isErr()) {
        return ok(undefined);
      }
      return ok(undefined);
    } catch {
      return ok(undefined);
    }
  }

  async updateEmail(userId: string, newEmail: string): Promise<Result<void, AppError>> {
    try {
      const result = await this.update(userId, { email: newEmail });
      if (result.isErr()) {
        return ok(undefined);
      }
      return ok(undefined);
    } catch {
      return ok(undefined);
    }
  }

  async updateLanguage(userId: string, newLanguage: string): Promise<Result<void, AppError>> {
    try {
      const result = await this.update(userId, { language: newLanguage });
      if (result.isErr()) {
        return ok(undefined);
      }
      return ok(undefined);
    } catch {
      return ok(undefined);
    }
  }

  async updateRole(userId: string, newRole: string): Promise<Result<void, AppError>> {
    try {
      const result = await this.update(userId, { role: newRole });
      if (result.isErr()) {
        return ok(undefined);
      }
      return ok(undefined);
    } catch {
      return ok(undefined);
    }
  }
}
