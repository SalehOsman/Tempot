import { AnyAbility, createMongoAbility } from '@casl/ability';
import { err, ok, Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { SessionUser } from '../contracts/session.types.js';
import { RoleEnum } from '../contracts/auth.roles.js';
import { authToggle } from '../auth.toggle.js';

export type AbilityDefinition = (user: SessionUser) => AnyAbility;

const CACHE_MAX_SIZE = 1_000;
const CACHE_TTL_MS = 5 * 60 * 1_000;

interface CacheEntry {
  ability: AnyAbility;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

function cacheKey(user: SessionUser): string {
  return `${String(user.id)}:${String(user.role)}`;
}

function pruneExpired(): void {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(key);
  }
}

export class AbilityFactory {
  static build(user: SessionUser, definitions: AbilityDefinition[]): Result<AnyAbility, AppError> {
    const disabled = authToggle.check();
    if (disabled) return disabled;

    const key = cacheKey(user);
    const now = Date.now();
    const cached = cache.get(key);
    if (cached && cached.expiresAt > now) {
      return validateAdministrativeBoundary(user, cached.ability);
    }

    const rules = definitions.flatMap((def) => def(user).rules) as Parameters<
      typeof createMongoAbility
    >[0];
    const ability = createMongoAbility(rules);
    const validationResult = validateAdministrativeBoundary(user, ability);
    if (validationResult.isErr()) return validationResult;

    if (cache.size >= CACHE_MAX_SIZE) pruneExpired();
    if (cache.size >= CACHE_MAX_SIZE) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) cache.delete(firstKey);
    }
    cache.set(key, { ability, expiresAt: now + CACHE_TTL_MS });

    return validationResult;
  }

  static invalidate(userId: string | number, role?: string): void {
    if (role !== undefined) {
      cache.delete(`${String(userId)}:${role}`);
      return;
    }
    const prefix = `${String(userId)}:`;
    for (const key of cache.keys()) {
      if (key.startsWith(prefix)) cache.delete(key);
    }
  }

  static clearCache(): void {
    cache.clear();
  }
}

function validateAdministrativeBoundary(
  user: SessionUser,
  ability: AnyAbility,
): Result<AnyAbility, AppError> {
  if (user.role !== RoleEnum.SUPER_ADMIN && ability.can('manage', 'all')) {
    return err(
      new AppError('auth.invalid_manage_all_grant', {
        role: user.role,
        userId: String(user.id),
      }),
    );
  }

  return ok(ability);
}
