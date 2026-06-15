import { randomUUID } from 'node:crypto';
import {
  BaseRepository,
  PROTECTED_DATA_ERRORS,
  enforceActiveRecordScope,
  type DatabaseClient,
  type IAuditLogger,
  type Prisma,
  type ProtectedDataService,
} from '@tempot/database';
import { AppError } from '@tempot/shared';
import { ok, err, type Result } from 'neverthrow';
import { RoleEnum } from '@tempot/auth-core';
import {
  buildSafeUserListArgs,
  resolveUserProtectionOptions,
  type IdentityUpdateData,
  type UserProfile,
  type UserRepositoryProtectionOptions,
  type UserSearchDelegate,
  type UserSearchResult,
} from '../types/index.js';
import { canonicalizeUserLookupValue } from './user-lookup.normalizer.js';
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
    protection?: ProtectedDataService | UserRepositoryProtectionOptions,
  ) {
    super(auditLogger, db);
    this.protectionOptions = resolveUserProtectionOptions(protection);
    this.protectionMapper = new UserProtectionMapper(
      this.protectionOptions.protectedData,
      this.protectionOptions.readMode,
    );
  }

  private readonly protectionMapper: UserProtectionMapper;
  private readonly protectionOptions: UserRepositoryProtectionOptions;

  override withTransaction(tx: Prisma.TransactionClient): this {
    return new UserRepository(this.auditLogger, tx, this.protectionOptions) as this;
  }

  override async findById(id: string): Promise<Result<UserProfile, AppError>> {
    const result = await super.findById(id);
    return result.andThen((user) => this.recoverProtectedFields(user));
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
    const result = await this.persistUpdate(id, data);
    return result.andThen((user) => this.recoverProtectedFields(user));
  }

  async findByTelegramId(telegramId: string): Promise<Result<UserProfile, AppError>> {
    const result = await super.findMany({ where: { telegramId }, take: 1 });
    if (result.isErr()) return err(result.error);

    const user = result.value[0];
    if (!user) return err(new AppError('user-management.not_found', { telegramId }));

    return this.recoverProtectedFields(user);
  }

  async findByNationalId(nationalId: string): Promise<Result<UserProfile, AppError>> {
    const conditions = this.protectionMapper.createLookupConditions(nationalId, 'nationalId');
    if (conditions.isErr()) return err(conditions.error);
    if (!conditions.value) {
      return err(new AppError(PROTECTED_DATA_ERRORS.NOT_CONFIGURED));
    }

    const result = await super.findMany({ where: conditions.value });
    if (result.isErr()) return err(result.error);

    const normalizedNationalId = canonicalizeUserLookupValue(nationalId, 'nationalId');
    if (normalizedNationalId.isErr()) return err(normalizedNationalId.error);
    for (const candidate of result.value) {
      const recovery = this.recoverProtectedFields(candidate);
      if (recovery.isErr()) return err(recovery.error);
      if (recovery.value.nationalId === undefined) continue;
      const normalizedCandidate = canonicalizeUserLookupValue(
        recovery.value.nationalId,
        'nationalId',
      );
      if (normalizedCandidate.isErr()) return err(normalizedCandidate.error);
      if (normalizedCandidate.value === normalizedNationalId.value) return recovery;
    }
    return err(new AppError('user-management.not_found'));
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
      const lookup = this.protectionMapper.createLookupConditions(trimmedQuery, 'email');
      if (lookup.isErr()) return err(lookup.error);
      if (lookup.value) conditions.push(lookup.value);
      where = { OR: conditions };
    }

    const [usersResult, countResult] = await Promise.all([
      this.listSafeUsers({ where, skip: page * pageSize, take: pageSize }),
      this.countUsers(where),
    ]);
    if (usersResult.isErr()) return err(usersResult.error);
    if (countResult.isErr()) return err(countResult.error);
    return ok({
      users: usersResult.value,
      totalCount: countResult.value,
      page,
      pageSize,
    });
  }

  updateUsername(userId: string, newUsername: string): Promise<Result<void, AppError>> {
    return this.updateField(userId, 'username', newUsername);
  }

  updateEmail(userId: string, newEmail: string): Promise<Result<void, AppError>> {
    return this.updateField(userId, 'email', newEmail);
  }

  updateLanguage(userId: string, newLanguage: string): Promise<Result<void, AppError>> {
    return this.updateField(userId, 'language', newLanguage);
  }

  updateRole(userId: string, newRole: RoleEnum): Promise<Result<void, AppError>> {
    return this.updateField(userId, 'role', newRole);
  }

  updateIdentity(userId: string, identity: IdentityUpdateData): Promise<Result<void, AppError>> {
    return this.updateFields(userId, { ...identity });
  }

  updateNationalId(userId: string, nationalId: string): Promise<Result<void, AppError>> {
    return this.updateField(userId, 'nationalId', nationalId);
  }

  updateMobileNumber(userId: string, mobileNumber: string): Promise<Result<void, AppError>> {
    return this.updateField(userId, 'mobileNumber', mobileNumber);
  }

  updateBirthDate(userId: string, birthDate: Date): Promise<Result<void, AppError>> {
    return this.updateField(userId, 'birthDate', birthDate);
  }

  updateGender(userId: string, gender: 'male' | 'female'): Promise<Result<void, AppError>> {
    return this.updateField(userId, 'gender', gender);
  }

  updateGovernorate(userId: string, governorate: string): Promise<Result<void, AppError>> {
    return this.updateField(userId, 'governorate', governorate);
  }

  updateCountryCode(userId: string, countryCode: string): Promise<Result<void, AppError>> {
    return this.updateField(userId, 'countryCode', countryCode);
  }

  private async persistUpdate(
    id: string,
    data: Record<string, unknown>,
  ): Promise<Result<UserProfile, AppError>> {
    const protectedInput = this.protectionMapper.protectInput(data, id);
    if (protectedInput.isErr()) return err(protectedInput.error);
    return super.update(id, protectedInput.value);
  }

  private async listSafeUsers(
    args?: Record<string, unknown>,
  ): Promise<Result<UserProfile[], AppError>> {
    return super.findMany(buildSafeUserListArgs(args));
  }

  private async countUsers(where: Record<string, unknown>): Promise<Result<number, AppError>> {
    try {
      const count = await (this.model as unknown as UserSearchDelegate).count({
        where: enforceActiveRecordScope(where),
      });
      return ok(count);
    } catch (error) {
      return err(new AppError('user-management.search_count_failed', error));
    }
  }

  private recoverProtectedFields(user: UserProfile): Result<UserProfile, AppError> {
    return this.protectionMapper.recover(user);
  }

  private updateField(
    userId: string,
    field: string,
    value: unknown,
  ): Promise<Result<void, AppError>> {
    return this.updateFields(userId, { [field]: value });
  }

  private async updateFields(
    userId: string,
    data: Record<string, unknown>,
  ): Promise<Result<void, AppError>> {
    const result = await this.persistUpdate(userId, data);
    return result.isErr() ? err(result.error) : ok(undefined);
  }
}
