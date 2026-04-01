import { describe, it, expect } from 'vitest';
import { Guard } from '../../src/guards/auth.guard.js';
import { createMongoAbility } from '@casl/ability';
import { AppAction } from '../../src/contracts/auth.actions.js';
import { AppSubject } from '../../src/contracts/auth.subjects.js';

describe('Guard', () => {
  it('should return ok when action is permitted', () => {
    const ability = createMongoAbility([{ action: 'read', subject: 'all' }]);
    const result = Guard.enforce(ability, 'read' as AppAction, 'all' as AppSubject);
    expect(result.isOk()).toBe(true);
  });

  it('should return err auth.forbidden when action is denied', () => {
    const ability = createMongoAbility([{ action: 'read', subject: 'all' }]);
    const result = Guard.enforce(ability, 'manage' as AppAction, 'all' as AppSubject);
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe('auth.forbidden');
    }
  });
});
