import { describe, expect, it } from 'vitest';
import { defineAbility } from '@casl/ability';
import type { AbilityDefinition } from '@tempot/auth-core';
import { AbilityRegistry } from '../../../src/authorization/ability-registry.js';

const readProfile: AbilityDefinition = () => defineAbility((can) => can('read', 'profile'));
const manageUsers: AbilityDefinition = () => defineAbility((can) => can('manage', 'users'));

describe('AbilityRegistry', () => {
  it('updates the stable runtime definition array after bot creation', () => {
    const registry = new AbilityRegistry();
    const runtimeDefinitions = registry.getRuntimeDefinitions();

    registry.register('user-management', readProfile);

    expect(registry.getRuntimeDefinitions()).toBe(runtimeDefinitions);
    expect(runtimeDefinitions).toEqual([readProfile]);
  });

  it('replaces a module definition without duplicating the module', () => {
    const registry = new AbilityRegistry();

    registry.register('user-management', readProfile);
    registry.register('user-management', manageUsers);

    expect(registry.getRuntimeDefinitions()).toEqual([manageUsers]);
  });

  it('returns a review snapshot that cannot mutate the runtime array', () => {
    const registry = new AbilityRegistry();
    registry.register('user-management', readProfile);

    const snapshot = registry.snapshot();
    snapshot.splice(0, 1);

    expect(registry.getRuntimeDefinitions()).toEqual([readProfile]);
  });
});
