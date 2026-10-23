import { createChildLogger } from '@tembot/logger';
import { asc, desc, eq } from 'drizzle-orm';
import type { PgDatabase } from 'drizzle-orm/pg-core';
import { type Result, err, ok } from 'neverthrow';
import { type AuditLogRecord, auditLogs } from '../db/schema.js';
import { GENESIS_HASH, computeAuditHash } from '../domain/hash-chain.js';
import {
  AuditError,
  type AuditIntegrityReport,
  type CreateAuditEventInput,
} from '../domain/types.js';

const auditLogger = createChildLogger({ module: 'audit-log', slice: 'service' });

export class AuditService {
  // biome-ignore lint/suspicious/noExplicitAny: Drizzle schema container accepts any schema mapping
  constructor(private readonly db: PgDatabase<any>) {}

  /**
   * Appends an immutable audit event to the cryptographic ledger.
   */
  async record(input: CreateAuditEventInput): Promise<Result<AuditLogRecord, AuditError>> {
    try {
      // 1. Fetch latest audit entry for this tenant to acquire previous hash
      const latestEntries = await this.db
        .select({ hash: auditLogs.hash })
        .from(auditLogs)
        .where(eq(auditLogs.tenantId, input.tenantId))
        .orderBy(desc(auditLogs.createdAt))
        .limit(1);

      const previousHash = latestEntries[0]?.hash ?? GENESIS_HASH;
      const now = new Date();
      const timestampIso = now.toISOString();

      // 2. Compute cryptographic signature
      const hash = computeAuditHash({
        previousHash,
        tenantId: input.tenantId,
        actorId: input.actorId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        payload: input.payload ?? {},
        timestampIso,
      });

      // 3. Insert record into append-only ledger
      const [inserted] = await this.db
        .insert(auditLogs)
        .values({
          tenantId: input.tenantId,
          traceId: input.traceId,
          actorId: input.actorId,
          actorType: input.actorType,
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId,
          status: input.status ?? 'SUCCESS',
          payload: input.payload ?? {},
          metadata: input.metadata ?? {},
          errorDetails: input.errorDetails,
          previousHash,
          hash,
          createdAt: now,
        })
        .returning();

      auditLogger.info(
        {
          auditId: inserted.id,
          action: inserted.action,
          actorId: inserted.actorId,
          tenantId: inserted.tenantId,
          hash: inserted.hash,
        },
        'Audit event appended to ledger',
      );

      return ok(inserted);
    } catch (error) {
      auditLogger.error({ error, input }, 'Failed to append audit event');
      return err(
        new AuditError(
          'AUDIT_RECORD_FAILED',
          'Failed to record audit event into immutable ledger',
          500,
          { input, originalError: String(error) },
        ),
      );
    }
  }

  /**
   * Cryptographically verifies the unbroken continuity of the audit trail.
   */
  async verifyChain(tenantId: string): Promise<Result<AuditIntegrityReport, AuditError>> {
    try {
      const records = await this.db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.tenantId, tenantId))
        .orderBy(asc(auditLogs.createdAt));

      if (records.length === 0) {
        return ok({
          isValid: true,
          totalRecordsChecked: 0,
          lastHash: GENESIS_HASH,
        });
      }

      let expectedPrevHash = GENESIS_HASH;

      for (let i = 0; i < records.length; i++) {
        const record = records[i];

        if (record.previousHash !== expectedPrevHash) {
          return ok({
            isValid: false,
            totalRecordsChecked: i,
            lastHash: expectedPrevHash,
            corruptedRecordId: record.id,
            reason: `Broken chain link at index ${i}: expected previousHash ${expectedPrevHash}, found ${record.previousHash}`,
          });
        }

        const calculatedHash = computeAuditHash({
          previousHash: record.previousHash,
          tenantId: record.tenantId,
          actorId: record.actorId,
          action: record.action,
          entityType: record.entityType,
          entityId: record.entityId,
          payload: record.payload,
          timestampIso: record.createdAt.toISOString(),
        });

        if (calculatedHash !== record.hash) {
          return ok({
            isValid: false,
            totalRecordsChecked: i,
            lastHash: record.previousHash,
            corruptedRecordId: record.id,
            reason: `Data tampering detected at index ${i}: hash mismatch for record ${record.id}`,
          });
        }

        expectedPrevHash = record.hash;
      }

      return ok({
        isValid: true,
        totalRecordsChecked: records.length,
        lastHash: expectedPrevHash,
      });
    } catch (error) {
      auditLogger.error({ error, tenantId }, 'Failed to verify audit chain');
      return err(
        new AuditError(
          'AUDIT_VERIFICATION_FAILED',
          'Failed to complete cryptographic verification of audit ledger',
          500,
          { tenantId, originalError: String(error) },
        ),
      );
    }
  }
}
