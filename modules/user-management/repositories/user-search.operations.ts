import { PROTECTED_DATA_ERRORS, enforceActiveRecordScope } from '@tempot/database';
import { RoleEnum } from '@tempot/auth-core';
import { AppError } from '@tempot/shared';
import { err, ok, type Result } from 'neverthrow';
import type { UserProfile, UserSearchDelegate } from '../types/index.js';
import { canonicalizeUserLookupValue } from './user-lookup.normalizer.js';
import type { UserProtectionMapper } from './user-protection.mapper.js';

export function parseTelegramId(telegramId: string): Result<bigint, AppError> {
  if (!/^[1-9]\d*$/u.test(telegramId)) {
    return err(new AppError('user-management.invalid_telegram_id', { telegramId }));
  }
  return ok(BigInt(telegramId));
}

export function normalizeNationalId(nationalId: string): Result<string, AppError> {
  return canonicalizeUserLookupValue(nationalId, 'nationalId');
}

export function buildUserSearchWhere(
  query: string,
  protectionMapper: Pick<UserProtectionMapper, 'createLookupConditions'>,
): Result<Record<string, unknown>, AppError> {
  const trimmedQuery = query.trim();
  if (trimmedQuery.length === 0) return ok({});

  const conditions: Record<string, unknown>[] = [
    { username: { contains: trimmedQuery, mode: 'insensitive' } },
  ];
  const lookup = protectionMapper.createLookupConditions(trimmedQuery, 'email');
  if (lookup.isErr()) return err(lookup.error);
  if (lookup.value) conditions.push(lookup.value);
  return ok({ OR: conditions });
}

export async function countUsers(
  model: unknown,
  where: Record<string, unknown>,
): Promise<Result<number, AppError>> {
  try {
    const count = await (model as UserSearchDelegate).count({
      where: enforceActiveRecordScope(where),
    });
    return ok(count);
  } catch (error) {
    return err(new AppError('user-management.search_count_failed', error));
  }
}

export function countActiveSuperAdmins(model: unknown): Promise<Result<number, AppError>> {
  return countUsers(model, { role: RoleEnum.SUPER_ADMIN });
}

export function requireProtectionLookup<T>(value: T | undefined): Result<T, AppError> {
  if (!value) return err(new AppError(PROTECTED_DATA_ERRORS.NOT_CONFIGURED));
  return ok(value);
}

export async function findByNationalIdOp(
  nationalId: string,
  protectionMapper: Pick<UserProtectionMapper, 'createLookupConditions' | 'recover'>,
  findMany: (args: Record<string, unknown>) => Promise<Result<UserProfile[], AppError>>,
): Promise<Result<UserProfile, AppError>> {
  const conditions = protectionMapper.createLookupConditions(nationalId, 'nationalId');
  if (conditions.isErr()) return err(conditions.error);
  const protectedLookup = requireProtectionLookup(conditions.value);
  if (protectedLookup.isErr()) return err(protectedLookup.error);

  const result = await findMany({ where: protectedLookup.value });
  if (result.isErr()) return err(result.error);

  const normalizedNationalId = normalizeNationalId(nationalId);
  if (normalizedNationalId.isErr()) return err(normalizedNationalId.error);
  for (const candidate of result.value) {
    const recovery = protectionMapper.recover(candidate);
    if (recovery.isErr()) return err(recovery.error);
    if (recovery.value.nationalId === undefined) continue;
    const normalizedCandidate = normalizeNationalId(recovery.value.nationalId);
    if (normalizedCandidate.isErr()) return err(normalizedCandidate.error);
    if (normalizedCandidate.value === normalizedNationalId.value) return recovery;
  }
  return err(new AppError('user-management.not_found'));
}
