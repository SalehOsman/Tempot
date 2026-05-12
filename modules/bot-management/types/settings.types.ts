export type BotPrivacyMode = 'standard' | 'strict';

export interface BotSettingsProfile {
  id: string;
  botId: string;
  locale: string;
  country: string;
  timezone: string;
  notificationsEnabled: boolean;
  privacyMode: BotPrivacyMode;
  featureToggles: Record<string, boolean>;
  createdAt: Date;
  updatedAt: Date;
}

export interface BotSettingsProfileInput {
  locale: string;
  country: string;
  timezone: string;
  notificationsEnabled: boolean;
  privacyMode: BotPrivacyMode;
  featureToggles: Record<string, boolean>;
}
