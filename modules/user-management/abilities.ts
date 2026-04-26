/**
 * User Management Abilities
 *
 * تعريف صلاحيات الموديول باستخدام CASL عبر AbilityFactory من @tempot/auth-core.
 * لا يوجد RBAC يدوي في أي مكان — كل فحص صلاحية يمر من هنا.
 *
 * الأدوار المعتمدة (4 فقط): GUEST | USER | ADMIN | SUPER_ADMIN
 * المواضيع: 'profile' | 'users' | 'all'
 * الأفعال: 'read' | 'update' | 'manage'
 */

import { AbilityBuilder, createMongoAbility, type AnyAbility } from '@casl/ability';
import { RoleEnum } from '@tempot/auth-core';
import type { SessionUser } from '@tempot/auth-core';

export type UserManagementSubject = 'profile' | 'users' | 'all';
export type UserManagementAction = 'read' | 'update' | 'manage';

/**
 * يبني ability لمستخدم محدد بناءً على دوره.
 * يُستخدم مع AbilityFactory.build() من @tempot/auth-core.
 */
export function userManagementAbilities(user: SessionUser): AnyAbility {
  const { can, build } = new AbilityBuilder(createMongoAbility);

  switch (user.role) {
    case RoleEnum.SUPER_ADMIN:
      can('manage', 'all');
      break;

    case RoleEnum.ADMIN:
      can('manage', 'users');
      can('read', 'profile');
      can('update', 'profile');
      break;

    case RoleEnum.USER:
      can('read', 'profile');
      can('update', 'profile');
      break;

    case RoleEnum.GUEST:
    default:
      can('read', 'profile');
      break;
  }

  return build();
}

/**
 * فحص صلاحية محددة — يُرجع boolean مباشرة للاستخدام في الـ handlers.
 * مثال: canDo(user, 'manage', 'users')
 */
export function canDo(
  user: SessionUser,
  action: UserManagementAction | 'manage',
  subject: UserManagementSubject,
): boolean {
  return userManagementAbilities(user).can(action, subject);
}
