import { AbilityBuilder, createMongoAbility, type AnyAbility } from '@casl/ability';
import { RoleEnum } from '@tempot/auth-core';
import type { SessionUser } from '@tempot/auth-core';

export type TemplateSubject =
  | 'template'
  | 'template-own'
  | 'category'
  | 'tag'
  | 'rating'
  | 'subscription'
  | 'all';

export type TemplateManagementAction =
  | 'read'
  | 'create'
  | 'update'
  | 'delete'
  | 'review'
  | 'publish'
  | 'manage';

export function templateManagementAbilities(user: SessionUser): AnyAbility {
  const { can, build } = new AbilityBuilder(createMongoAbility);

  switch (user.role) {
    case RoleEnum.SUPER_ADMIN:
      can('manage', 'all');
      break;

    case RoleEnum.ADMIN:
      can('read', 'template');
      can('create', 'template');
      can('update', 'template-own');
      can('delete', 'template-own');
      can('review', 'template');
      can('publish', 'template');
      can('manage', 'category');
      can('manage', 'tag');
      can('create', 'rating');
      can('update', 'rating');
      can('create', 'subscription');
      can('delete', 'subscription');
      can('manage', 'template');
      break;

    case RoleEnum.USER:
      can('read', 'template');
      can('create', 'template');
      can('update', 'template-own');
      can('delete', 'template-own');
      can('create', 'rating');
      can('update', 'rating');
      can('create', 'subscription');
      can('delete', 'subscription');
      break;

    case RoleEnum.GUEST:
    default:
      can('read', 'template');
      break;
  }

  return build();
}

export function canDoTemplate(
  user: SessionUser,
  action: TemplateManagementAction,
  subject: TemplateSubject,
): boolean {
  return templateManagementAbilities(user).can(action, subject);
}
