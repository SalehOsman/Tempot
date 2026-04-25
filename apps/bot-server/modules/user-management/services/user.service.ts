import { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { UserRepository } from '../repositories/user.repository';
import { UserProfile } from '../types/user.types';

export class UserService {
  private static cache = new Map<string, { user: UserProfile; expiresAt: number }>();
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  static async getByTelegramId(telegramId: string): Promise<Result<UserProfile, AppError>> {
    // Check cache
    const cached = this.cache.get(telegramId);
    if (cached && cached.expiresAt > Date.now()) {
      return Result.ok(cached.user);
    }

    // Fetch from database
    const result = await UserRepository.findByTelegramId(telegramId);
    if (result.isErr()) {
      return result;
    }

    const user = result.value;

    // Update cache
    this.cache.set(telegramId, {
      user,
      expiresAt: Date.now() + this.CACHE_TTL,
    });

    return Result.ok(user);
  }

  static async getById(userId: string): Promise<Result<UserProfile, AppError>> {
    const result = await UserRepository.findById(userId);
    if (result.isErr()) {
      return result;
    }

    const user = result.value;

    // Update cache
    this.cache.set(user.telegramId, {
      user,
      expiresAt: Date.now() + this.CACHE_TTL,
    });

    return Result.ok(user);
  }

  static async updateUsername(
    userId: string,
    newUsername: string,
  ): Promise<Result<void, AppError>> {
    const result = await UserRepository.updateUsername(userId, newUsername);
    if (result.isErr()) {
      return result;
    }

    // Invalidate cache
    const userResult = await this.getById(userId);
    if (userResult.isOk()) {
      this.cache.delete(userResult.value.telegramId);
    }

    return Result.ok(undefined);
  }

  static async updateEmail(userId: string, newEmail: string): Promise<Result<void, AppError>> {
    const result = await UserRepository.updateEmail(userId, newEmail);
    if (result.isErr()) {
      return result;
    }

    // Invalidate cache
    const userResult = await this.getById(userId);
    if (userResult.isOk()) {
      this.cache.delete(userResult.value.telegramId);
    }

    return Result.ok(undefined);
  }

  static async updateLanguage(
    userId: string,
    newLanguage: string,
  ): Promise<Result<void, AppError>> {
    const result = await UserRepository.updateLanguage(userId, newLanguage);
    if (result.isErr()) {
      return result;
    }

    // Invalidate cache
    const userResult = await this.getById(userId);
    if (userResult.isOk()) {
      this.cache.delete(userResult.value.telegramId);
    }

    return Result.ok(undefined);
  }

  static async searchUsers(
    query: string,
    page: number = 0,
    pageSize: number = 10,
  ): Promise<Result<UserProfile[], AppError>> {
    const result = await UserRepository.search(query, page, pageSize);
    if (result.isErr()) {
      return result;
    }

    return Result.ok(result.value.users);
  }

  static invalidateCache(telegramId: string): void {
    this.cache.delete(telegramId);
  }
}
