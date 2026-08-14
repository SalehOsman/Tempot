export enum BotLifecycleStatus {
  DRAFT = 'DRAFT',
  CONFIGURED = 'CONFIGURED',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  MAINTENANCE = 'MAINTENANCE',
  ARCHIVED = 'ARCHIVED',
}

export type RequiredBotManagementRole = 'ADMIN' | 'SUPER_ADMIN';

export interface BotTransitionPolicy {
  requiredRole: RequiredBotManagementRole;
  requiresReason: boolean;
}

export interface BotLifecycleEvent {
  id: string;
  botId: string;
  fromStatus: BotLifecycleStatus | null;
  toStatus: BotLifecycleStatus;
  actorId: string;
  reason: string | null;
  createdAt: Date;
}
