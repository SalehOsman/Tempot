import { randomUUID } from 'node:crypto';
import {
  BaseRepository,
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
  type UserSearchResult,
} from '../types/index.js';
import { UserProtectionMapper } from './user-protection.mapper.js';
import {
  buildUserSearchWhere,
  countActiveSuperAdmins,
  countUsers,
  normalizeNationalId,
  parseTelegramId,
  requireProtectionLookup,
} from './user-search.operations.js';
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
    const parsedTelegramId = parseTelegramId(telegramId);
    if (parsedTelegramId.isErr()) return err(parsedTelegramId.error);

    const result = await super.findMany({ where: { telegramId: parsedTelegramId.value }, take: 1 });
    if (result.isErr()) return err(result.error);

    const user = result.value[0];
    if (!user) return err(new AppError('user-management.not_found', { telegramId }));

    return this.recoverProtectedFields(user);
  }

  async createMemberProfile(input: {
    telegramId: string;
    username?: string;
    language: string;
    role: RoleEnum.USER;
  }): Promise<Result<UserProfile, AppError>> {
    const parsedTelegramId = parseTelegramId(input.telegramId);
    if (parsedTelegramId.isErr()) return err(parsedTelegramId.error);

    const result = await super.create({
      telegramId: parsedTelegramId.value,
      username: input.username,
      language: input.language,
      role: input.role,
    });
    return result.andThen((user) => this.recoverProtectedFields(user));
  }

  countActiveSuperAdmins(): Promise<Result<number, AppError>> {
    return countActiveSuperAdmins(this.model);
  }
  async findByNationalId(nationalId: string): Promise<Result<UserProfile, AppError>> {
    const conditions = this.protectionMapper.createLookupConditions(nationalId, 'nationalId');
    if (conditions.isErr()) return err(conditions.error);
    const protectedLookup = requireProtectionLookup(conditions.value);
    if (protectedLookup.isErr()) return err(protectedLookup.error);

    const result = await super.findMany({ where: protectedLookup.value });
    if (result.isErr()) return err(result.error);

    const normalizedNationalId = normalizeNationalId(nationalId);
    if (normalizedNationalId.isErr()) return err(normalizedNationalId.error);
    for (const candidate of result.value) {
      const recovery = this.recoverProtectedFields(candidate);
      if (recovery.isErr()) return err(recovery.error);
      if (recovery.value.nationalId === undefined) continue;
      const normalizedCandidate = normalizeNationalId(recovery.value.nationalId);
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
    const whereResult = buildUserSearchWhere(query, this.protectionMapper);
    if (whereResult.isErr()) return err(whereResult.error);
    const where = whereResult.value;

    const [usersResult, countResult] = await Promise.all([
      this.listSafeUsers({ where, skip: page * pageSize, take: pageSize }),
      countUsers(this.model, where),
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
  updateUsername(userId: string, value: string): Promise<Result<void, AppError>> {
    return this.updateField(userId, 'username', value);
  }
  updateEmail(userId: string, value: string): Promise<Result<void, AppError>> {
    return this.updateField(userId, 'email', value);
  }
  updateLanguage(userId: string, value: string): Promise<Result<void, AppError>> {
    return this.updateField(userId, 'language', value);
  }
  updateRole(userId: string, value: RoleEnum): Promise<Result<void, AppError>> {
    return this.updateField(userId, 'role', value);
  }
  updateIdentity(userId: string, value: IdentityUpdateData): Promise<Result<void, AppError>> {
    return this.updateFields(userId, { ...value });
  }
  updateNationalId(userId: string, value: string): Promise<Result<void, AppError>> {
    return this.updateField(userId, 'nationalId', value);
  }
  updateMobileNumber(userId: string, value: string): Promise<Result<void, AppError>> {
    return this.updateField(userId, 'mobileNumber', value);
  }
  updateBirthDate(userId: string, value: Date): Promise<Result<void, AppError>> {
    return this.updateField(userId, 'birthDate', value);
  }
  updateGender(userId: string, value: 'male' | 'female'): Promise<Result<void, AppError>> {
    return this.updateField(userId, 'gender', value);
  }
  updateGovernorate(userId: string, value: string): Promise<Result<void, AppError>> {
    return this.updateField(userId, 'governorate', value);
  }
  updateCountryCode(userId: string, value: string): Promise<Result<void, AppError>> {
    return this.updateField(userId, 'countryCode', value);
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
