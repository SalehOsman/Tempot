import { createMongoAbility } from '@casl/ability';
import { RoleEnum, type AbilityDefinition } from '@tempot/auth-core';

export const membershipAbilityDefinition: AbilityDefinition = (user) => {
  if (user.role === RoleEnum.SUPER_ADMIN || user.role === RoleEnum.ADMIN) {
    return createMongoAbility([
      { action: 'create', subject: 'membership-request' },
      { action: 'manage', subject: 'membership-request' },
    ]);
  }
  return createMongoAbility([{ action: 'create', subject: 'membership-request' }]);
};
