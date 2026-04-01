import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AbilityFactory } from '../../src/factory/ability.factory.js';
import { Guard } from '../../src/guards/auth.guard.js';
import { SessionUser } from '../../src/contracts/session.types.js';
import { RoleEnum } from '../../src/contracts/auth.roles.js';
import { defineAbility, createMongoAbility } from '@casl/ability';
import { AppAction } from '../../src/contracts/auth.actions.js';
import { AppSubject } from '../../src/contracts/auth.subjects.js';

describe('auth toggle guard (Rule XVI)', () => {
  const originalEnv = process.env['TEMPOT_AUTH_CORE'];

  beforeEach(() => {
    delete process.env['TEMPOT_AUTH_CORE'];
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env['TEMPOT_AUTH_CORE'];
    } else {
      process.env['TEMPOT_AUTH_CORE'] = originalEnv;
    }
  });

  describe('AbilityFactory.build', () => {
    const user: SessionUser = { id: 1, role: RoleEnum.USER };
    const definition = (u: SessionUser) =>
      defineAbility((can) => {
        if (u.role === RoleEnum.USER) can('read', 'all');
      });

    it('should work normally when TEMPOT_AUTH_CORE is not set', () => {
      const result = AbilityFactory.build(user, [definition]);
      expect(result.isOk()).toBe(true);
    });

    it('should return Err with code auth-core.disabled when TEMPOT_AUTH_CORE=false', () => {
      process.env['TEMPOT_AUTH_CORE'] = 'false';
      const result = AbilityFactory.build(user, [definition]);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('auth-core.disabled');
      }
    });
  });

  describe('Guard.enforce', () => {
    const ability = createMongoAbility([{ action: 'read', subject: 'all' }]);

    it('should return Err with code auth-core.disabled when TEMPOT_AUTH_CORE=false', () => {
      process.env['TEMPOT_AUTH_CORE'] = 'false';
      const result = Guard.enforce(ability, 'read' as AppAction, 'all' as AppSubject);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('auth-core.disabled');
      }
    });
  });
});
