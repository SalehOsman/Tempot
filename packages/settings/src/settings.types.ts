import type { AsyncResult } from '@tempot/shared';
import type { AppError } from '@tempot/shared';
import type { CacheService } from '@tempot/shared';
import type { SettingsRepositoryPort } from './settings.repository.js';

/** Static settings validated from .env at startup */
export interface StaticSettings {
  botToken: string;
  databaseUrl: string;
  superAdminIds: number[];
  defaultLanguage: string;
  defaultCountry: string;
}

/** Join mode for the bot */
export type JoinMode = 'AUTO' | 'REQUEST' | 'INVITE_ONLY' | 'CLOSED';

/** Known dynamic setting keys with their value types */
export interface DynamicSettingDefinitions {
  join_mode: JoinMode;
  maintenance_mode: boolean;
  approval_role: string;
  backup_schedule: string;
  log_retention_days: number;
  dynamic_default_language: string;
}

/** Type-safe dynamic setting key */
export type DynamicSettingKey = keyof DynamicSettingDefinitions;

/** Database entity for a dynamic setting */
export interface DynamicSettingRecord {
  key: string;
  value: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}

/** Event payload for setting changes */
export interface SettingChangedPayload {
  key: string;
  oldValue: unknown;
  newValue: unknown;
  changedBy: string | null;
}

/** Event payload for maintenance mode toggle */
export interface MaintenanceModePayload {
  enabled: boolean;
  changedBy: string | null;
}

/** Maintenance status check result */
export interface MaintenanceStatus {
  enabled: boolean;
  isSuperAdmin: (userId: number) => boolean;
}

/** Minimal logger interface — structurally compatible with pino.Logger */
export interface SettingsLogger {
  info: (data: unknown) => void;
  warn: (data: unknown) => void;
  error: (data: unknown) => void;
  debug: (data: unknown) => void;
}

/** Minimal event bus interface — structurally compatible with EventBusOrchestrator */
export interface SettingsEventBus {
  publish(eventName: string, payload: unknown): AsyncResult<void, AppError>;
}

/** Dependencies for DynamicSettingsService */
export interface DynamicSettingsServiceDeps {
  repository: SettingsRepositoryPort;
  cache: CacheService;
  eventBus: SettingsEventBus;
  logger: SettingsLogger;
}

/** Default values for all dynamic settings (type-safe via mapped type — DC-6) */
export const DYNAMIC_SETTING_DEFAULTS: { [K in DynamicSettingKey]: DynamicSettingDefinitions[K] } =
  {
    join_mode: 'AUTO',
    maintenance_mode: false,
    approval_role: '',
    backup_schedule: '',
    log_retention_days: 90,
    dynamic_default_language: '',
  };
