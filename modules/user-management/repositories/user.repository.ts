/**
 * UserRepository — قاعدة بيانات المستخدمين
 */

import { randomUUID } from 'node:crypto';
import {
  BaseRepository,
  PROTECTED_DATA_ERRORS,
  type DatabaseClient,
  type IAuditLogger,
  type Prisma,
  type ProtectedDataService,
} from '@tempot/database';
import { AppError } from '@tempot/shared';
import { ok, err, type Result } from 'neverthrow';
import { RoleEnum } from '@tempot/auth-core';
import type { UserProfile, UserSearchResult } from '../types/index.js';
import { UserProtectionMapper } from './user-protection.mapper.js';

export class UserRepository extends BaseRepository<UserProfile> {
  protected moduleName = 'user-management';
  protected entityName = 'userProfile';

  protected get model() {
    return this.db.userProfile;
  }

  constructor(
    auditLogger: IAuditLogger,
    db?: DatabaseClient,
    private readonly protectedData?: ProtectedDataService,
  ) {
    super(auditLogger, db);
    this.protectionMapper = new UserProtectionMapper(protectedData);
  }

  private readonly protectionMapper: UserProtectionMapper;

  override withTransaction(tx: Prisma.TransactionClient): this {
    return new UserRepository(this.auditLogger, tx, this.protectedData) as this;
  }

  override async findById(id: string): Promise<Result<UserProfile, AppError>> {
    const result = await super.findById(id);
    return result.andThen((user) => this.recoverProtectedFields(user));
  }

  override async findMany(
    where?: Record<string, unknown>,
  ): Promise<Result<UserProfile[], AppError>> {
    const result = await super.findMany(where);
    if (result.isErr()) return err(result.error);

    const recovered: UserProfile[] = [];
    for (const user of result.value) {
      const recovery = this.recoverProtectedFields(user);
      if (recovery.isErr()) return err(recovery.error);
      recovered.push(recovery.value);
    }
    return ok(recovered);
  }

  override async create(data: Record<string, unknown>): Promise<Result<UserProfile, AppError>> {
    const recordId = typeof data['id'] === 'string' ? data['id'] : randomUUID();
    const protectedInput = this.protectionMapper.protectInput({ ...data, id: recordId }, recordId);
    if (protectedInput.isErr()) return err(protectedInput.error);

    const result = await super.create(protectedInput.value);
    return result.andThen((user) => this.recoverProtectedFields(user));
  }

  override async update(
    id: string,
    data: Record<string, unknown>,
  ): Promise<Result<UserProfile, AppError>> {
    const protectedInput = this.protectionMapper.protectInput(data, id);
    if (protectedInput.isErr()) return err(protectedInput.error);

    const result = await super.update(id, protectedInput.value);
    return result.andThen((user) => this.recoverProtectedFields(user));
  }

  async findByTelegramId(telegramId: string): Promise<Result<UserProfile, AppError>> {
    const result = await this.findMany({ telegramId });
    if (result.isErr()) return err(result.error);

    const user = result.value[0];
    if (!user) return err(new AppError('user-management.not_found', { telegramId }));

    return ok(user);
  }

  async findByNationalId(nationalId: string): Promise<Result<UserProfile, AppError>> {
    const tokenResult = this.protectionMapper.createLookupToken(nationalId, 'nationalId');
    if (tokenResult.isErr()) return err(tokenResult.error);
    if (!tokenResult.value) {
      return err(new AppError(PROTECTED_DATA_ERRORS.NOT_CONFIGURED));
    }

    const result = await this.findMany({ nationalIdLookupToken: tokenResult.value });
    if (result.isErr()) return err(result.error);

    const user = result.value[0];
    if (!user) return err(new AppError('user-management.not_found'));
    return ok(user);
  }

  async search(
    query: string,
    page: number = 0,
    pageSize: number = 10,
  ): Promise<Result<UserSearchResult, AppError>> {
    const trimmedQuery = query.trim();
    let where: Record<string, unknown> = {};
    if (trimmedQuery.length > 0) {
      const conditions: Record<string, unknown>[] = [
        { username: { contains: trimmedQuery, mode: 'insensitive' } },
      ];
      const tokenResult = this.protectionMapper.createEmailLookupToken(trimmedQuery);
      if (tokenResult.isErr()) return err(tokenResult.error);
      if (tokenResult.value) conditions.push({ emailLookupToken: tokenResult.value });
      where = { OR: conditions };
    }

    const usersResult = await this.findMany({ where, skip: page * pageSize, take: pageSize });
    if (usersResult.isErr()) return err(usersResult.error);

    const allResult = await this.findMany({ where });
    if (allResult.isErr()) return err(allResult.error);

    return ok({ users: usersResult.value, totalCount: allResult.value.length, page, pageSize });
  }

  private recoverProtectedFields(user: UserProfile): Result<UserProfile, AppError> {
    return this.protectionMapper.recover(user);
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
