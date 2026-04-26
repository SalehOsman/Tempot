import { Ability, AbilityBuilder } from '@casl/ability';
import { RoleEnum } from '@tempot/auth-core';

export type UserManagementAbility = Ability;
export type AppSubject = 'users' | 'profile' | 'all' | 'own';
export type AppAction = 'create' | 'read' | 'update' | 'delete' | 'manage';

export interface SessionUser {
  id: string;
  telegramId: string;
  role: RoleEnum;
}

export type AbilityDefinition = (user: SessionUser) => Ability;

export const userManagementAbilities: AbilityDefinition = (user: SessionUser) => {
  const { can, build } = new AbilityBuilder(Ability);

  if (user.role === RoleEnum.SUPER_ADMIN) {
    can('manage', 'all');
    return build();
  }

  if (user.role === RoleEnum.ADMIN) {
    can('manage', 'users');
    can('read', 'all');
    return build();
  }

  if (user.role === RoleEnum.USER) {
    can('read', 'own');
    can('update', 'own');
    return build();
  }

  // GUEST
  can('read', 'own');
  return build();
};
