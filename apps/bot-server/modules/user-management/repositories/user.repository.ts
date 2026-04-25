import { BaseRepository } from '@tempot/database';
import { AppError } from '@tempot/shared';
import { ok, err, type Result } from 'neverthrow';
import { UserProfile, UserSearchResult } from '../types/index.js';

export class UserRepository extends BaseRepository<UserProfile> {
  protected moduleName = 'user-management';
  protected entityName = 'user';

  protected get model() {
    return this.db.user;
  }

  async findByTelegramId(telegramId: string): Promise<Result<UserProfile, AppError>> {
    const result = await this.findMany({ telegramId });
    if (result.isErr()) {
      return result;
    }

    const user = result.value[0];
    if (!user) {
      return err(new AppError('user-management.user_not_found'));
    }

    return ok(user);
  }

  async search(
    query: string,
    page: number = 0,
    pageSize: number = 10,
  ): Promise<Result<UserSearchResult, AppError>> {
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
      return usersResult;
    }

    const users = usersResult.value;

    // Get total count by fetching all matching records
    const allUsersResult = await this.findMany({ where });
    if (allUsersResult.isErr()) {
      return allUsersResult;
    }

    const totalCount = allUsersResult.value.length;

    return ok({
      users,
      totalCount,
      page,
      pageSize,
    });
  }

  async updateUsername(userId: string, newUsername: string): Promise<Result<void, AppError>> {
    const result = await this.update(userId, { username: newUsername });
    if (result.isErr()) {
      return result;
    }
    return ok(undefined);
  }

  async updateEmail(userId: string, newEmail: string): Promise<Result<void, AppError>> {
    const result = await this.update(userId, { email: newEmail });
    if (result.isErr()) {
      return result;
    }
    return ok(undefined);
  }

  async updateLanguage(userId: string, newLanguage: string): Promise<Result<void, AppError>> {
    const result = await this.update(userId, { language: newLanguage });
    if (result.isErr()) {
      return result;
    }
    return ok(undefined);
  }

  async updateRole(userId: string, newRole: string): Promise<Result<void, AppError>> {
    const result = await this.update(userId, { role: newRole });
    if (result.isErr()) {
      return result;
    }
    return ok(undefined);
  }
}
