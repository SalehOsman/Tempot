import { describe, it, expect } from 'vitest';
import { migrateSession, CURRENT_SCHEMA_VERSION } from '../../src/migrator';
import type { Session } from '../../src/types';

const baseSession: Session = {
  userId: 'user-1',
  chatId: 'chat-1',
  role: 'USER',
  status: 'ACTIVE',
  language: 'ar',
  activeConversation: null,
  metadata: null,
  schemaVersion: 1,
  version: 1,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

describe('migrateSession', () => {
  it('should export CURRENT_SCHEMA_VERSION as a number', () => {
    expect(typeof CURRENT_SCHEMA_VERSION).toBe('number');
  });

  it('should return session unchanged if already at current schema version', () => {
    const session: Session = { ...baseSession, schemaVersion: CURRENT_SCHEMA_VERSION };
    const result = migrateSession(session);
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual(session);
    }
  });

  it('should handle session with schemaVersion === 1 (current) without error', () => {
    const session: Session = { ...baseSession, schemaVersion: 1 };
    const result = migrateSession(session);
    expect(result.isOk()).toBe(true);
    expect(result.isErr()).toBe(false);
  });

  it('should return err(AppError) for an unknown/future schema version', () => {
    const session: Session = { ...baseSession, schemaVersion: 999 };
    const result = migrateSession(session);
    expect(result.isErr()).toBe(true);
  });
});
