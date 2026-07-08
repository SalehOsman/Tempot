import type { ModuleConfig, ModuleNavigationItem, UserRole } from '@tempot/module-registry';
import type { ModuleDependencyContainer, ModuleNavigationActor } from '../bot-server.types.js';

const ROLE_LEVELS: Record<UserRole, number> = {
  GUEST: 1,
  USER: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
};

export function createModuleNavigationProvider(
  configs: ModuleConfig[],
): ModuleDependencyContainer['navigation'] {
  const entries = configs.flatMap((config) => config.navigation?.mainMenu ?? []);
  return {
    getMainMenuItems: (role: UserRole) =>
      entries
        .filter((entry) => isRoleAllowed(role, entry.requiredRole))
        .sort(compareNavigationItems),
    getVisibleMainMenuItems: (actor: ModuleNavigationActor) =>
      entries.filter((entry) => canSeeNavigationItem(actor, entry)).sort(compareNavigationItems),
  };
}

function canSeeNavigationItem(actor: ModuleNavigationActor, entry: ModuleNavigationItem): boolean {
  if (!isRoleAllowed(actor.role, entry.requiredRole)) return false;
  if (entry.accessClassification === 'admin' && !isRoleAllowed(actor.role, 'ADMIN')) {
    return false;
  }

  const requiredAbility = entry.requiredAbility;
  if (requiredAbility === undefined) return true;
  return actor.abilities.includes(requiredAbility) || actor.abilities.includes('manage.all');
}

function isRoleAllowed(actorRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_LEVELS[actorRole] >= ROLE_LEVELS[requiredRole];
}

function compareNavigationItems(left: ModuleNavigationItem, right: ModuleNavigationItem): number {
  return left.row - right.row || left.order - right.order || left.id.localeCompare(right.id);
}
