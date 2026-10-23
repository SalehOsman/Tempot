import { describe, expect, it } from 'vitest';
import { GENESIS_HASH, computeAuditHash } from '../src/domain/hash-chain.js';

describe('Audit Hash Chaining Specification', () => {
  it('computes deterministic SHA-256 hash for audit events', () => {
    const data = {
      previousHash: GENESIS_HASH,
      tenantId: 'tenant-123',
      actorId: 'admin-1',
      action: 'user.created',
      entityType: 'user',
      entityId: 'user-456',
      payload: { role: 'operator' },
      timestampIso: '2026-10-23T00:00:00.000Z',
    };

    const hash1 = computeAuditHash(data);
    const hash2 = computeAuditHash(data);

    expect(hash1).toHaveLength(64);
    expect(hash1).toBe(hash2);
  });

  it('detects tampering: modifying payload produces a completely different hash', () => {
    const base = {
      previousHash: GENESIS_HASH,
      tenantId: 'tenant-123',
      actorId: 'admin-1',
      action: 'user.created',
      entityType: 'user',
      entityId: 'user-456',
      payload: { role: 'operator' },
      timestampIso: '2026-10-23T00:00:00.000Z',
    };

    const originalHash = computeAuditHash(base);
    const tamperedHash = computeAuditHash({
      ...base,
      payload: { role: 'superadmin' }, // Tampered value!
    });

    expect(originalHash).not.toBe(tamperedHash);
  });

  it('detects tampering: modifying previousHash breaks the chain', () => {
    const base = {
      previousHash: GENESIS_HASH,
      tenantId: 'tenant-123',
      actorId: 'admin-1',
      action: 'user.created',
      entityType: 'user',
      entityId: 'user-456',
      payload: {},
      timestampIso: '2026-10-23T00:00:00.000Z',
    };

    const originalHash = computeAuditHash(base);
    const tamperedPrevHash = computeAuditHash({
      ...base,
      previousHash: 'f'.repeat(64),
    });

    expect(originalHash).not.toBe(tamperedPrevHash);
  });
});
