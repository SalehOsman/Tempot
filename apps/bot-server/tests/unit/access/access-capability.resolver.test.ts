import { describe, expect, it } from 'vitest';
import type { Context } from 'grammy';
import { capabilityFromContext } from '../../../src/access/access-capability.resolver.js';

function callbackContext(data: string): Context {
  return { callbackQuery: { data } } as unknown as Context;
}

describe('capabilityFromContext', () => {
  it.each(['users:roles:user-2', 'users:role:user-2:ADMIN', 'users:role-confirm:user-2:ADMIN'])(
    'requires role-management ability for %s',
    (callbackData) => {
      expect(capabilityFromContext(callbackContext(callbackData))).toMatchObject({
        id: 'callback.users',
        classification: 'admin',
        requiredAbility: 'manage.roles',
      });
    },
  );

  it('keeps regular users callbacks on user-management ability', () => {
    expect(capabilityFromContext(callbackContext('users:list'))).toMatchObject({
      id: 'callback.users',
      classification: 'admin',
      requiredAbility: 'manage.users',
    });
  });
});
