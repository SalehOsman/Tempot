import { AbilityBuilder, createMongoAbility, type AnyAbility } from '@casl/ability';
import { RoleEnum, type SessionUser } from '@tempot/auth-core';

export type BotManagementSubject =
  | 'bot'
  | 'settings-profile'
  | 'module-enablement'
  | 'template-source'
  | 'health'
  | 'import'
  | 'export'
  | 'all';

export type BotManagementAction =
  | 'read'
  | 'create'
  | 'update'
  | 'delete'
  | 'manage'
  | 'transition'
  | 'enable'
  | 'import'
  | 'export';

export function botManagementAbilities(user: SessionUser): AnyAbility {
  const { can, build } = new AbilityBuilder(createMongoAbility);

  switch (user.role) {
    case RoleEnum.SUPER_ADMIN:
      can('manage', 'all');
      break;

    case RoleEnum.ADMIN:
      can('manage', 'bot');
      can('manage', 'settings-profile');
      can('manage', 'module-enablement');
      can('manage', 'template-source');
      can('read', 'health');
      can('import', 'import');
      can('export', 'export');
      break;

    case RoleEnum.USER:
      can('read', 'bot');
      can('read', 'settings-profile');
      can('read', 'module-enablement');
      can('read', 'health');
      break;

    case RoleEnum.GUEST:
    default:
      break;
  }

  return build();
}

export function canDoBotManagement(
  user: SessionUser,
  action: BotManagementAction,
  subject: BotManagementSubject,
): boolean {
  return botManagementAbilities(user).can(action, subject);
}

export const abilityDefinition = botManagementAbilities;
