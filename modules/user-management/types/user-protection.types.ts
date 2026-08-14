import type { ProtectedDataService } from '@tempot/database';

export type UserProtectedReadMode = 'protected-only' | 'legacy-compatible';

export const USER_LIST_SELECT = {
  id: true,
  telegramId: true,
  username: true,
  language: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

export interface UserSearchDelegate {
  count(args: Record<string, unknown>): Promise<number>;
}

export interface UserRepositoryProtectionOptions {
  protectedData?: ProtectedDataService;
  readMode: UserProtectedReadMode;
}

export function buildSafeUserListArgs(where?: Record<string, unknown>): Record<string, unknown> {
  if (!where) return { where: {}, select: USER_LIST_SELECT };
  const isArgs = 'where' in where || 'skip' in where || 'take' in where || 'orderBy' in where;
  return isArgs ? { ...where, select: USER_LIST_SELECT } : { where, select: USER_LIST_SELECT };
}

export function resolveUserProtectionOptions(
  protection?: ProtectedDataService | UserRepositoryProtectionOptions,
): UserRepositoryProtectionOptions {
  if (protection && 'readMode' in protection) return protection;
  return { protectedData: protection, readMode: 'protected-only' };
}
