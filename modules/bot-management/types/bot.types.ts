import type { BotLifecycleStatus } from './lifecycle.types.js';

export enum BotRuntimeMode {
  POLLING = 'POLLING',
  WEBHOOK = 'WEBHOOK',
}

export enum BotHealthStatus {
  UNKNOWN = 'unknown',
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
}

export interface ManagedBot {
  id: string;
  displayName: string;
  telegramUsername: string;
  tokenFingerprint: string;
  tokenRedacted: string;
  ownerId: string;
  runtimeMode: BotRuntimeMode;
  status: BotLifecycleStatus;
  defaultLocale: string;
  defaultCountry: string;
  timezone: string;
  healthStatus: BotHealthStatus;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt: Date | null;
  deletedBy: string | null;
}

export interface CreateManagedBotInput {
  displayName: string;
  telegramUsername: string;
  tokenFingerprint: string;
  tokenRedacted: string;
  ownerId: string;
  runtimeMode: BotRuntimeMode;
  status: BotLifecycleStatus;
  defaultLocale: string;
  defaultCountry: string;
  timezone: string;
}
