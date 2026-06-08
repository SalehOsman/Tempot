import type { ModuleConfig, ModuleNavigationItem, UserRole } from '@tempot/module-registry';
import type { ModuleDependencyContainer } from '../bot-server.types.js';

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
        .filter((entry) => ROLE_LEVELS[role] >= ROLE_LEVELS[entry.requiredRole])
        .sort(compareNavigationItems),
  };
}

function compareNavigationItems(left: ModuleNavigationItem, right: ModuleNavigationItem): number {
  return left.row - right.row || left.order - right.order || left.id.localeCompare(right.id);
}
