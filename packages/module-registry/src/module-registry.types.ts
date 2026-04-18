import type { AsyncResult } from '@tempot/shared';

/** User roles from the CASL-based RBAC system (Rule XXVI) */
export type UserRole = 'GUEST' | 'USER' | 'ADMIN' | 'SUPER_ADMIN';

/** AI degradation mode (Constitution Rule XXXIII) */
export type AiDegradationMode = 'graceful' | 'queue' | 'disable';

/** Command definition from module.config.ts */
export interface ModuleCommand {
  command: string;
  description: string;
}

/** Feature flags for a module (Section 15.3) */
export interface ModuleFeatures {
  hasDatabase: boolean;
  hasNotifications: boolean;
  hasAttachments: boolean;
  hasExport: boolean;
  hasAI: boolean;
  hasInputEngine: boolean;
  hasImport: boolean;
  hasSearch: boolean;
  hasDynamicCMS: boolean;
  hasRegional: boolean;
}

/** Module dependency requirements */
export interface ModuleRequirements {
  packages: string[];
  optional: string[];
}

/** Full module configuration — 22 mandatory fields (Section 15.3) */
export interface ModuleConfig {
  name: string;
  version: string;
  requiredRole: UserRole;
  commands: ModuleCommand[];
  features: ModuleFeatures;
  isActive: boolean;
  isCore: boolean;
  aiDegradationMode?: AiDegradationMode;
  requires: ModuleRequirements;
  scopedUsers?: number[];
}

/** Feature flag to package name mapping (D5 in spec.md) */
export const FEATURE_PACKAGE_MAP: Record<string, string> = {
  hasNotifications: 'notifier',
  hasAttachments: 'storage-engine',
  hasAI: 'ai-core',
  hasInputEngine: 'input-engine',
  hasImport: 'import-engine',
  hasSearch: 'search-engine',
  hasDynamicCMS: 'cms-engine',
  hasRegional: 'regional-engine',
};

/** Toggle guard entry for a package */
interface ToggleGuardEntry {
  envVar: string;
  defaultEnabled: boolean;
}

/** Toggle guard packages from Architecture Spec Section 30 (DC-3) */
export const TOGGLE_GUARD_PACKAGES: Record<string, ToggleGuardEntry> = {
  'auth-core': { envVar: 'TEMPOT_AUTH', defaultEnabled: true },
  'session-manager': { envVar: 'TEMPOT_SESSIONS', defaultEnabled: true },
  notifier: { envVar: 'TEMPOT_NOTIFIER', defaultEnabled: true },
  logger: { envVar: 'TEMPOT_LOGGER', defaultEnabled: true },
  'audit-log': { envVar: 'TEMPOT_AUDIT', defaultEnabled: true },
  'ai-core': { envVar: 'TEMPOT_AI', defaultEnabled: true },
  'storage-engine': { envVar: 'TEMPOT_STORAGE', defaultEnabled: true },
  'backup-engine': { envVar: 'TEMPOT_BACKUP', defaultEnabled: true },
  'regional-engine': { envVar: 'TEMPOT_REGIONAL', defaultEnabled: true },
  'privacy-module': { envVar: 'TEMPOT_PRIVACY', defaultEnabled: true },
  dashboard: { envVar: 'TEMPOT_DASHBOARD', defaultEnabled: true },
  'input-engine': { envVar: 'TEMPOT_INPUT', defaultEnabled: false },
  'cms-engine': { envVar: 'TEMPOT_DYNAMIC_CMS', defaultEnabled: false },
  'search-engine': { envVar: 'TEMPOT_SEARCH', defaultEnabled: false },
  'document-engine': { envVar: 'TEMPOT_DOCUMENTS', defaultEnabled: false },
  'import-engine': { envVar: 'TEMPOT_IMPORT', defaultEnabled: false },
  'payment-core': { envVar: 'TEMPOT_PAYMENT', defaultEnabled: false },
  'mini-apps': { envVar: 'TEMPOT_MINI_APPS', defaultEnabled: false },
  sentry: { envVar: 'TEMPOT_SENTRY', defaultEnabled: false },
};

/** A module that has been discovered but not yet validated */
export interface DiscoveredModule {
  name: string;
  path: string;
  config: ModuleConfig;
}

/** A module that has passed all validation checks */
export interface ValidatedModule {
  name: string;
  path: string;
  config: ModuleConfig;
  validatedAt: Date;
}

/** Validation error detail */
export interface ValidationError {
  module: string;
  code: string;
  message: string;
}

/** Discovery result summary */
export interface DiscoveryResult {
  discovered: DiscoveredModule[];
  skipped: Array<{ name: string; isCore: boolean }>;
  failed: Array<{ path: string; error: string }>;
}

/** Validation result summary */
export interface ValidationResult {
  validated: ValidatedModule[];
  skipped: string[];
  failed: ValidationError[];
}

/** Logger interface (minimal — injected dependency) */
export interface RegistryLogger {
  info: (data: Record<string, unknown>) => void;
  warn: (data: Record<string, unknown>) => void;
  error: (data: Record<string, unknown>) => void;
  debug: (data: Record<string, unknown>) => void;
}

/** Event bus interface (minimal — injected dependency) */
export interface RegistryEventBus {
  publish: <K extends string>(
    event: K,
    payload: Record<string, unknown>,
  ) => Promise<{ isOk: () => boolean }>;
}

/** Bot interface (minimal — injected for command registration) */
export interface RegistryBot {
  api: {
    setMyCommands: (commands: Array<{ command: string; description: string }>) => Promise<boolean>;
  };
}

/** Port interface for module discovery (DC-6) */
export interface ModuleDiscoveryPort {
  discover(): AsyncResult<DiscoveryResult>;
}

/** Port interface for module validation (DC-6) */
export interface ModuleValidatorPort {
  validate(discovered: DiscoveredModule[]): AsyncResult<ValidationResult>;
}
