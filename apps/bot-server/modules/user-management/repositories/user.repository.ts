import { BaseRepository } from '@tempot/database';
import { AppError } from '@tempot/shared';
import { Result } from 'neverthrow';
import { UserProfile, UserSearchResult } from '../types/index.js';

export class UserRepository extends BaseRepository<UserProfile> {
  protected moduleName = 'user-management';
  protected entityName = 'user';

  protected get model() {
    return this.db.user;
  }

  async findByTelegramId(telegramId: string): Promise<Result<UserProfile, AppError>> {
    return this.findFirst({
      where: { telegramId },
    });
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

    const [users, totalCount] = await Promise.all([
      this.findMany({
        where,
        skip: page * pageSize,
        take: pageSize,
      }),
      this.count({ where }),
    ]);

    if (users.isErr()) {
      return users;
    }

    if (totalCount.isErr()) {
      return totalCount;
    }

    return Result.ok({
      users: users.value,
      totalCount: totalCount.value,
      page,
      pageSize,
    });
  }

  async updateUsername(userId: string, newUsername: string): Promise<Result<void, AppError>> {
    return this.update(userId, { username: newUsername });
  }

  async updateEmail(userId: string, newEmail: string): Promise<Result<void, AppError>> {
    return this.update(userId, { email: newEmail });
  }

  async updateLanguage(userId: string, newLanguage: string): Promise<Result<void, AppError>> {
    return this.update(userId, { language: newLanguage });
  }

  async updateRole(userId: string, newRole: string): Promise<Result<void, AppError>> {
    return this.update(userId, { role: newRole });
  }
}
