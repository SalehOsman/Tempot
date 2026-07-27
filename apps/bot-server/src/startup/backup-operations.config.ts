const DEFAULT_BACKUP_SOURCE_ENVIRONMENT = 'local';
const DEFAULT_BACKUP_OUTPUT_DIRECTORY = '/app/backups';
const DEFAULT_RESTORE_FILES_DIRECTORY = '/app/restore-rehearsals';
const DEFAULT_PRISMA_CLI_PATH = '/app/node_modules/.pnpm/node_modules/.bin/prisma';
const DEFAULT_PRISMA_SCHEMA_PATH = '/app/node_modules/@tempot/database/prisma/schema.prisma';
const DEFAULT_PRISMA_WORKING_DIRECTORY = '/app/node_modules/@tempot/database';
const DEFAULT_BACKUP_FILENAME_TIME_ZONE = 'UTC';
const DEFAULT_ACTIVE_JOB_STALE_AFTER_MS = 15 * 60 * 1000;
const RESTORE_TARGET_CLASSIFICATION = 'isolated-restore';

export function resolveBackupSourceEnvironment(): string {
  return (
    process.env['TEMPOT_ENVIRONMENT'] ??
    process.env['NODE_ENV'] ??
    DEFAULT_BACKUP_SOURCE_ENVIRONMENT
  );
}

export function buildBackupConfig() {
  return {
    databaseUrl: requiredEnv('DATABASE_URL'),
    encryptionKey: resolveBackupEncryptionKey(),
    filenameTimeZone: resolveBackupFilenameTimeZone(),
    outputDirectory: resolveBackupStoragePath(),
    managedFilesPath: process.env['STORAGE_LOCAL_PATH'],
  };
}

export function buildRestoreConfig() {
  return {
    encryptionKey: resolveBackupEncryptionKey(),
    liveDatabaseUrl: requiredEnv('DATABASE_URL'),
    restoreDatabaseUrl: requiredEnv('TEMPOT_BACKUP_RESTORE_DATABASE_URL'),
    restoredFilesPath:
      process.env['TEMPOT_BACKUP_RESTORE_FILES_PATH'] ?? DEFAULT_RESTORE_FILES_DIRECTORY,
    targetClassification: RESTORE_TARGET_CLASSIFICATION,
  };
}

export function buildProductionRestoreConfig() {
  return {
    encryptionKey: resolveBackupEncryptionKey(),
    liveDatabaseUrl: requiredEnv('DATABASE_URL'),
    liveFilesPath: process.env['STORAGE_LOCAL_PATH'],
    prismaCliPath: process.env['TEMPOT_BACKUP_PRISMA_CLI_PATH'] ?? DEFAULT_PRISMA_CLI_PATH,
    prismaSchemaPath: process.env['TEMPOT_BACKUP_PRISMA_SCHEMA_PATH'] ?? DEFAULT_PRISMA_SCHEMA_PATH,
    prismaWorkingDirectory:
      process.env['TEMPOT_BACKUP_PRISMA_WORKING_DIRECTORY'] ?? DEFAULT_PRISMA_WORKING_DIRECTORY,
    workPath:
      process.env['TEMPOT_BACKUP_PRODUCTION_RESTORE_WORK_PATH'] ??
      process.env['TEMPOT_BACKUP_RESTORE_FILES_PATH'] ??
      DEFAULT_RESTORE_FILES_DIRECTORY,
  };
}

export function buildDatabaseFactoryResetConfig() {
  return {
    databaseUrl: requiredEnv('DATABASE_URL'),
    prismaCliPath: process.env['TEMPOT_BACKUP_PRISMA_CLI_PATH'] ?? DEFAULT_PRISMA_CLI_PATH,
    prismaSchemaPath: process.env['TEMPOT_BACKUP_PRISMA_SCHEMA_PATH'] ?? DEFAULT_PRISMA_SCHEMA_PATH,
    prismaWorkingDirectory:
      process.env['TEMPOT_BACKUP_PRISMA_WORKING_DIRECTORY'] ?? DEFAULT_PRISMA_WORKING_DIRECTORY,
  };
}

export function resolveBackupStoragePath(): string {
  return process.env['TEMPOT_BACKUP_STORAGE_PATH'] ?? DEFAULT_BACKUP_OUTPUT_DIRECTORY;
}

export function resolveActiveJobStaleAfterMs(): number {
  const configured = Number(process.env['TEMPOT_BACKUP_ACTIVE_JOB_STALE_AFTER_MS']);
  return Number.isFinite(configured) && configured > 0
    ? configured
    : DEFAULT_ACTIVE_JOB_STALE_AFTER_MS;
}

function resolveBackupEncryptionKey(): string {
  return (
    process.env['TEMPOT_BACKUP_ENCRYPTION_KEY'] ?? requiredEnv('PROTECTED_DATA_ENCRYPTION_KEYS')
  );
}

function resolveBackupFilenameTimeZone(): string {
  return process.env['TEMPOT_BACKUP_FILENAME_TIME_ZONE'] ?? DEFAULT_BACKUP_FILENAME_TIME_ZONE;
}

function requiredEnv(name: string): string {
  return process.env[name] ?? '';
}
