import { ok, type Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { UserRepository } from '../repositories/user.repository.js';
import { UserProfile } from '../types/index.js';

export class UserService {
  private static cache = new Map<string, { user: UserProfile; expiresAt: number }>();
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private static repository: UserRepository | null = null;

  private static getRepository(): UserRepository {
    if (!this.repository) {
      // Create a simple audit logger
      const auditLogger = {
        log: async (_data: Record<string, unknown>) => {
          // Audit logging will be implemented later
        },
      };
      this.repository = new UserRepository(auditLogger);
    }
    return this.repository;
  }

  static async getByTelegramId(telegramId: string): Promise<Result<UserProfile, AppError>> {
    // Check cache
    const cached = this.cache.get(telegramId);
    if (cached && cached.expiresAt > Date.now()) {
      return ok(cached.user);
    }

    // Fetch from database
    const result = await this.getRepository().findByTelegramId(telegramId);
    if (result.isErr()) {
      return result;
    }

    const user = result.value;

    // Update cache
    this.cache.set(telegramId, {
      user,
      expiresAt: Date.now() + this.CACHE_TTL,
    });

    return ok(user);
  }

  static async getById(userId: string): Promise<Result<UserProfile, AppError>> {
    const result = await this.getRepository().findById(userId);
    if (result.isErr()) {
      return result;
    }

    const user = result.value;

    // Update cache
    this.cache.set(user.telegramId, {
      user,
      expiresAt: Date.now() + this.CACHE_TTL,
    });

    return ok(user);
  }

  static async updateUsername(
    userId: string,
    newUsername: string,
  ): Promise<Result<void, AppError>> {
    const result = await this.getRepository().updateUsername(userId, newUsername);
    if (result.isErr()) {
      return result;
    }

    // Invalidate cache
    const userResult = await this.getById(userId);
    if (userResult.isOk()) {
      this.cache.delete(userResult.value.telegramId);
    }

    return ok(undefined);
  }

  static async updateEmail(userId: string, newEmail: string): Promise<Result<void, AppError>> {
    const result = await this.getRepository().updateEmail(userId, newEmail);
    if (result.isErr()) {
      return result;
    }

    // Invalidate cache
    const userResult = await this.getById(userId);
    if (userResult.isOk()) {
      this.cache.delete(userResult.value.telegramId);
    }

    return ok(undefined);
  }

  static async updateLanguage(
    userId: string,
    newLanguage: string,
  ): Promise<Result<void, AppError>> {
    const result = await this.getRepository().updateLanguage(userId, newLanguage);
    if (result.isErr()) {
      return result;
    }

    // Invalidate cache
    const userResult = await this.getById(userId);
    if (userResult.isOk()) {
      this.cache.delete(userResult.value.telegramId);
    }

    return ok(undefined);
  }

  static async searchUsers(
    query: string,
    page: number = 0,
    pageSize: number = 10,
  ): Promise<Result<UserProfile[], AppError>> {
    const result = await this.getRepository().search(query, page, pageSize);
    return result.map((searchResult) => searchResult.users);
  }

  static invalidateCache(telegramId: string): void {
    this.cache.delete(telegramId);
  }
}
