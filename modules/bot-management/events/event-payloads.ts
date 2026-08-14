import type { BotHealthStatus } from '../types/bot.types.js';
import type { BotLifecycleStatus } from '../types/lifecycle.types.js';
import type { BotModuleEnablementState } from '../types/module-enablement.types.js';

export interface BotRegisteredEvent {
  botId: string;
  ownerId: string;
  actorId: string;
}

export interface BotUpdatedEvent {
  botId: string;
  actorId: string;
  changedFields: readonly string[];
}

export interface BotLifecycleChangedEvent {
  botId: string;
  fromStatus: BotLifecycleStatus;
  toStatus: BotLifecycleStatus;
  actorId: string;
  reason?: string;
}

export interface BotSettingsChangedEvent {
  botId: string;
  actorId: string;
  changedFields: readonly string[];
}

export interface BotModuleEnablementChangedEvent {
  botId: string;
  moduleName: string;
  state: BotModuleEnablementState;
  actorId: string;
  blockedReason?: string;
}

export interface BotProvisioningCompletedEvent {
  botId: string;
  templateId: string;
  templateVersionId: string;
  actorId: string;
}

export interface BotHealthChangedEvent {
  botId: string;
  fromStatus: BotHealthStatus;
  toStatus: BotHealthStatus;
  summaryKey: string;
}

export interface BotExportCompletedEvent {
  botId: string;
  exportId: string;
  artifactId: string;
  requestedBy: string;
}

export interface BotImportCompletedEvent {
  importId: string;
  createdBotId: string;
  requestedBy: string;
}
