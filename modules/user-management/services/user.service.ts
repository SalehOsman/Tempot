/**
 * UserService — Business logic لإدارة المستخدمين
 */

import { ok, type Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { RoleEnum } from '@tempot/auth-core';
import { UserRepository } from '../repositories/user.repository.js';
import type { UserProfile } from '../types/index.js';
import { extractNationalIdData } from '@tempot/national-id-parser';

interface AuditLoggerLike {
  log: (data: Record<string, unknown>) => Promise<void>;
}

interface CacheEntry {
  user: UserProfile;
  expiresAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000;

export class UserService {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly repository: UserRepository;

  constructor(auditLogger: AuditLoggerLike) {
    this.repository = new UserRepository(auditLogger);
  }

  // ─── Read ────────────────────────────────────────────────────────────────────

  async getByTelegramId(telegramId: string): Promise<Result<UserProfile, AppError>> {
    const cached = this.cache.get(telegramId);
    if (cached && cached.expiresAt > Date.now()) return ok(cached.user);

    const result = await this.repository.findByTelegramId(telegramId);
    if (result.isErr()) return result;

    this.setCacheEntry(telegramId, result.value);
    return ok(result.value);
  }

  async getById(userId: string): Promise<Result<UserProfile, AppError>> {
    const result = await this.repository.findById(userId);
    if (result.isErr()) return result;

    this.setCacheEntry(result.value.telegramId, result.value);
    return ok(result.value);
  }

  async searchUsers(
    query: string,
    page: number = 0,
    pageSize: number = 10,
  ): Promise<Result<UserProfile[], AppError>> {
    const result = await this.repository.search(query, page, pageSize);
    return result.map((r) => r.users);
  }

  // ─── Update — الحقول الأساسية ────────────────────────────────────────────────

  async updateUsername(userId: string, newUsername: string): Promise<Result<void, AppError>> {
    this.invalidateCacheByUserId(userId);
    return this.repository.updateUsername(userId, newUsername);
  }

  async updateEmail(userId: string, newEmail: string): Promise<Result<void, AppError>> {
    this.invalidateCacheByUserId(userId);
    return this.repository.updateEmail(userId, newEmail);
  }

  async updateLanguage(userId: string, newLanguage: string): Promise<Result<void, AppError>> {
    this.invalidateCacheByUserId(userId);
    return this.repository.updateLanguage(userId, newLanguage);
  }

  async updateRole(userId: string, newRole: RoleEnum): Promise<Result<void, AppError>> {
    this.invalidateCacheByUserId(userId);
    return this.repository.updateRole(userId, newRole);
  }

  // ─── Update — الحقول المصرية ─────────────────────────────────────────────────

  async updateNationalId(
    userId: string,
    nationalId: string,
    countryCode?: string,
  ): Promise<
    Result<{ extracted: boolean; data?: ReturnType<typeof extractNationalIdData> }, AppError>
  > {
    this.invalidateCacheByUserId(userId);

    const isEgyptian = !countryCode || countryCode === '+20';
    const extractedData = isEgyptian ? extractNationalIdData(nationalId) : null;

    if (extractedData) {
      const updates: Promise<Result<void, AppError>>[] = [
        this.repository.updateNationalId(userId, nationalId),
      ];
      if (extractedData.gender)
        updates.push(this.repository.updateGender(userId, extractedData.gender));
      if (extractedData.birthDate)
        updates.push(this.repository.updateBirthDate(userId, extractedData.birthDate));
      if (extractedData.governorate)
        updates.push(this.repository.updateGovernorate(userId, extractedData.governorate));

      const results = await Promise.all(updates);
      const firstError = results.find((r) => r.isErr());
      if (firstError) return firstError as Result<never, AppError>;

      return ok({ extracted: true, data: extractedData });
    }

    const result = await this.repository.updateNationalId(userId, nationalId);
    if (result.isErr()) return result as Result<never, AppError>;
    return ok({ extracted: false });
  }

  async extractFromExistingNationalId(
    userId: string,
    nationalId: string,
  ): Promise<Result<ReturnType<typeof extractNationalIdData>, AppError>> {
    const extractedData = extractNationalIdData(nationalId);
    if (!extractedData) return ok(null);

    this.invalidateCacheByUserId(userId);

    const updates: Promise<Result<void, AppError>>[] = [];
    if (extractedData.gender)
      updates.push(this.repository.updateGender(userId, extractedData.gender));
    if (extractedData.birthDate)
      updates.push(this.repository.updateBirthDate(userId, extractedData.birthDate));
    if (extractedData.governorate)
      updates.push(this.repository.updateGovernorate(userId, extractedData.governorate));

    const results = await Promise.all(updates);
    const firstError = results.find((r) => r.isErr());
    if (firstError) return firstError as Result<never, AppError>;

    return ok(extractedData);
  }

  async updateMobileNumber(userId: string, mobileNumber: string): Promise<Result<void, AppError>> {
    this.invalidateCacheByUserId(userId);
    return this.repository.updateMobileNumber(userId, mobileNumber);
  }

  async updateBirthDate(userId: string, birthDate: Date): Promise<Result<void, AppError>> {
    this.invalidateCacheByUserId(userId);
    return this.repository.updateBirthDate(userId, birthDate);
  }

  async updateGender(userId: string, gender: 'male' | 'female'): Promise<Result<void, AppError>> {
    this.invalidateCacheByUserId(userId);
    return this.repository.updateGender(userId, gender);
  }

  async updateGovernorate(userId: string, governorate: string): Promise<Result<void, AppError>> {
    this.invalidateCacheByUserId(userId);
    return this.repository.updateGovernorate(userId, governorate);
  }

  async updateCountryCode(userId: string, countryCode: string): Promise<Result<void, AppError>> {
    this.invalidateCacheByUserId(userId);
    return this.repository.updateCountryCode(userId, countryCode);
  }

  // ─── Cache helpers ────────────────────────────────────────────────────────────

  invalidateCacheByTelegramId(telegramId: string): void {
    this.cache.delete(telegramId);
  }

  private setCacheEntry(telegramId: string, user: UserProfile): void {
    this.cache.set(telegramId, { user, expiresAt: Date.now() + CACHE_TTL_MS });
  }

  private invalidateCacheByUserId(userId: string): void {
    for (const [key, entry] of this.cache.entries()) {
      if (entry.user.id === userId) {
        this.cache.delete(key);
        return;
      }
    }
  }
}
