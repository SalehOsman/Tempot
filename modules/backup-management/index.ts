import type { Bot, Context, MiddlewareFn } from 'grammy';
import type {
  BackupArtifact,
  BackupJob,
  BackupListResult,
  DatabaseFactoryResetResult,
  ProductionRestoreResult,
  RestoreRehearsal,
} from '@tempot/backup-engine';
import type { ModuleConfig } from '@tempot/module-registry';
import { registerDeps } from './deps.context.js';
import { backupsCommand } from './commands/backups.command.js';
import { handleCallbackQuery } from './handlers/callback.handler.js';

export interface ModuleLogger {
  info: (data: unknown) => void;
  warn: (data: unknown) => void;
  error: (data: unknown) => void;
  debug: (data: unknown) => void;
  child: (bindings: Record<string, unknown>) => ModuleLogger;
}

export interface ModuleAuthorizationPolicy {
  module: string;
  classification: 'public' | 'bootstrap' | 'protected' | 'admin';
  action: string;
  subject: string;
}

export interface ModuleAuthorizationProvider {
  guard: (policy: ModuleAuthorizationPolicy) => MiddlewareFn<Context>;
  enforce: (ctx: Context, policy: ModuleAuthorizationPolicy) => Promise<boolean>;
}

export type BackupOperationResult<T> =
  | {
      success: true;
      value: T;
    }
  | {
      success: false;
      error: { code: string };
    };

export interface BackupOperationsProvider {
  requestBackup: (actorId: string) => Promise<
    BackupOperationResult<{
      job: BackupJob;
      artifact?: BackupArtifact;
      storageReference?: string;
    }>
  >;
  listBackups: (limit: number) => Promise<BackupOperationResult<BackupListResult>>;
  restoreLatest: (actorId: string) => Promise<BackupOperationResult<RestoreRehearsal>>;
  restoreBackup: (
    backupJobId: string,
    actorId: string,
  ) => Promise<BackupOperationResult<RestoreRehearsal>>;
  restoreProductionBackup: (
    backupJobId: string,
    actorId: string,
  ) => Promise<BackupOperationResult<ProductionRestoreResult>>;
  factoryResetDatabase: (
    actorId: string,
  ) => Promise<BackupOperationResult<DatabaseFactoryResetResult>>;
}

export interface ModuleDeps {
  logger: ModuleLogger;
  i18n: { t: (key: string, options?: Record<string, unknown>) => string };
  authorization: ModuleAuthorizationProvider;
  backups?: BackupOperationsProvider;
  config: ModuleConfig;
}

const backupPolicy: ModuleAuthorizationPolicy = {
  module: 'backup-management',
  classification: 'admin',
  action: 'manage',
  subject: 'backups',
};

const setup = async (bot: Bot<Context>, deps: ModuleDeps): Promise<void> => {
  registerDeps(deps);
  bot.command('backups', deps.authorization.guard(backupPolicy), backupsCommand);
  bot.on('callback_query:data', handleCallbackQuery);
  deps.logger.info({ msg: 'backup-management handlers registered' });
};

export default setup;
export { backupManagementAbilities, abilityDefinition } from './abilities.js';
