export { auditLogManifest } from './module.manifest.js';
export {
  auditLogs,
  type AuditLogRecord,
  type NewAuditLogRecord,
} from './db/schema.js';
export {
  computeAuditHash,
  GENESIS_HASH,
  type HashableAuditPayload,
} from './domain/hash-chain.js';
export {
  AuditError,
  type ActorType,
  type AuditStatus,
  type CreateAuditEventInput,
  type CaptureErrorInput,
  type AuditIntegrityReport,
} from './domain/types.js';
export { AuditService } from './application/audit-service.js';
export { ErrorRecorder } from './application/error-recorder.js';
