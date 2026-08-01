import { defineAbility } from '@casl/ability';

interface AbilityActor {
  readonly id: string | number;
  readonly role: string;
}

export function knowledgeManagementAbilities(user: AbilityActor) {
  return defineAbility((can) => {
    if (user.role === 'SUPER_ADMIN') {
      can('manage', 'knowledge');
      can('read', 'knowledge-status');
      can('create', 'knowledge-ingestion');
    }
  });
}

export const abilityDefinition = knowledgeManagementAbilities;
