import type { BotLifecycleStatus } from './lifecycle.types.js';
import type { BotRuntimeMode } from './bot.types.js';
import type { BotSettingsProfileInput } from './settings.types.js';
import type { BotModuleEnablementState } from './module-enablement.types.js';

export interface ExportedBotProfileBot {
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

export interface ExportedBotProfileModule {
  moduleName: string;
  state: BotModuleEnablementState;
  blockedReason?: string;
}

export interface ExportedBotProfile {
  schema: 'tempot-bot-profile/1.0';
  exportedAt: string;
  bot: ExportedBotProfileBot;
  settings: BotSettingsProfileInput;
  modules: ExportedBotProfileModule[];
  credentialSetupRequired: boolean;
}

export interface BotProfileImportInput {
  sourceProfile: ExportedBotProfile;
  targetStatus: BotLifecycleStatus.DRAFT;
}
