import type { prisma, ProtectedDataService } from '@tempot/database';

export type RotationDatabase = typeof prisma;

export interface SensitiveDataRotationOptions {
  migrationId: string;
  fromEncryptionKeyVersion: string;
  batchSize: number;
  protectionService: ProtectedDataService;
  database?: RotationDatabase;
  stopAfterBatches?: number;
}

export interface SensitiveDataRotationReport {
  status: 'paused' | 'complete';
  processedRows: number;
  rotatedFields: number;
  remainingOldReferences: number;
  retirementReady: boolean;
}

export interface RotationState {
  cursor: string | null;
  processedRows: number;
  rotatedFields: number;
}
