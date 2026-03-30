import { describe, it, expect } from 'vitest';
import { RoleEnum } from '../../src/contracts/roles.js';
import { AppAction } from '../../src/contracts/actions.js';

describe('Contracts', () => {
  it('should define correct roles', () => {
    expect(RoleEnum.GUEST).toBe('GUEST');
    expect(RoleEnum.SUPER_ADMIN).toBe('SUPER_ADMIN');
  });

  it('should allow AppAction assignment', () => {
    const action: AppAction = 'read';
    expect(action).toBe('read');
  });
});
