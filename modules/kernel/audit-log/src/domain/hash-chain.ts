import { createHash } from 'node:crypto';

export const GENESIS_HASH = '0'.repeat(64);

export interface HashableAuditPayload {
  readonly previousHash: string;
  readonly tenantId: string;
  readonly actorId: string;
  readonly action: string;
  readonly entityType: string;
  readonly entityId?: string | null;
  readonly payload: unknown;
  readonly timestampIso: string;
}

/**
 * Computes a SHA-256 cryptographic signature linking this audit entry
 * to the previous entry, establishing a tamper-evident audit ledger.
 */
export function computeAuditHash(data: HashableAuditPayload): string {
  const canonicalString = JSON.stringify({
    prev: data.previousHash,
    tenant: data.tenantId,
    actor: data.actorId,
    action: data.action,
    entity: data.entityType,
    entityId: data.entityId ?? '',
    payload: data.payload,
    ts: data.timestampIso,
  });

  return createHash('sha256').update(canonicalString).digest('hex');
}
