import type { prisma, ProtectedDataService } from '@tempot/database';

export type MigrationDatabase = typeof prisma;

export interface SensitiveDataBackfillOptions {
  migrationId: string;
  batchSize: number;
  protectionService: ProtectedDataService;
  database?: MigrationDatabase;
  dryRun?: boolean;
  stopAfterBatches?: number;
  forceVerificationFailure?: boolean;
}

export interface SensitiveDataBackfillReport {
  migrationId: string;
  status: 'dry-run' | 'paused' | 'ready-for-cutover';
  processedCount: number;
  verifiedCount: number;
  failureCount: number;
  duplicateCount: number;
  sanitizedAuditCount: number;
}

export interface CheckpointState {
  cursor: string | null;
  processedCount: number;
  verifiedCount: number;
  failureCount: number;
  status: string;
}
