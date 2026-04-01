import { describe, it, expect } from 'vitest';
import { createMongoAbility } from '@casl/ability';
import { AbilityFactory } from '../../src/factory/ability.factory.js';
import { Guard } from '../../src/guards/auth.guard.js';
import type { SessionUser } from '../../src/contracts/session.types.js';
import type { AbilityDefinition } from '../../src/factory/ability.factory.js';
import type { AppAction } from '../../src/contracts/auth.actions.js';
import type { AppSubject } from '../../src/contracts/auth.subjects.js';

describe('Performance', () => {
  const testUser: SessionUser = {
    id: 'user-1',
    role: 'ADMIN',
  };

  const singleDefinition: AbilityDefinition = (_user: SessionUser) =>
    createMongoAbility([{ action: 'read', subject: 'all' }]);

  it('AbilityFactory.build() with single definition (SC-001: < 5ms)', () => {
    const iterations = 1000;
    const definitions: AbilityDefinition[] = [singleDefinition];

    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      AbilityFactory.build(testUser, definitions);
    }
    const elapsed = performance.now() - start;
    const avgMs = elapsed / iterations;

    expect(avgMs).toBeLessThan(5);
  });

  it('Guard.enforce() permission check (SC-001: < 5ms)', () => {
    const definitions: AbilityDefinition[] = [singleDefinition];
    const result = AbilityFactory.build(testUser, definitions);

    expect(result.isOk()).toBe(true);
    const ability = result._unsafeUnwrap();

    const action: AppAction = 'read';
    const subject: AppSubject = 'all';
    const iterations = 1000;

    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      Guard.enforce(ability, action, subject);
    }
    const elapsed = performance.now() - start;
    const avgMs = elapsed / iterations;

    expect(avgMs).toBeLessThan(5);
  });
});
