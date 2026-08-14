export enum BotModuleEnablementState {
  ENABLED = 'ENABLED',
  DISABLED = 'DISABLED',
  UNAVAILABLE = 'UNAVAILABLE',
  BLOCKED = 'BLOCKED',
}

export interface BotModuleEnablement {
  id: string;
  botId: string;
  moduleName: string;
  state: BotModuleEnablementState;
  blockedReason: string | null;
  enabledBy: string | null;
  enabledAt: Date | null;
  updatedAt: Date;
}
