import { describe, expect, it } from 'vitest';
import { UserProtectionMapper } from '../../repositories/user-protection.mapper.js';
import type { UserProfile } from '../../types/index.js';

function legacyUser(): UserProfile {
  return {
    id: 'legacy-user',
    telegramId: '1001',
    username: 'legacy',
    email: 'legacy@example.invalid',
    language: 'en',
    role: 'USER',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
}

describe('UserProtectionMapper protected-read cutover', () => {
  it('should return a typed error when protected-only data lacks a protected payload', () => {
    const mapper = new UserProtectionMapper(undefined, 'protected-only');

    const result = mapper.recover(legacyUser());

    expect(result.isErr()).toBe(true);
    if (result.isOk()) return;
    expect(result.error.code).toBe('user-management.protected_payload_missing');
    expect(result.error.details).toEqual({
      fieldId: 'email',
      recordId: 'legacy-user',
    });
  });

  it('should preserve legacy plaintext only when migration compatibility is explicit', () => {
    const mapper = new UserProtectionMapper(undefined, 'legacy-compatible');

    const result = mapper.recover(legacyUser());

    expect(result.isOk()).toBe(true);
    if (result.isErr()) return;
    expect(result.value.email).toBe('legacy@example.invalid');
  });
});
