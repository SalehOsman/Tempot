import {
  BOT_ACCESS_MODES,
  DYNAMIC_SETTING_DEFAULTS,
  type DynamicSettingDefinitions,
  type DynamicSettingKey,
  type SettingsService,
} from '@tempot/settings';
import type { SettingsProvider } from '../bot-server.types.js';

function isDynamicSettingKey(key: string): key is DynamicSettingKey {
  return key in DYNAMIC_SETTING_DEFAULTS;
}

function isJoinMode(value: unknown): value is DynamicSettingDefinitions['join_mode'] {
  switch (value) {
    case 'AUTO':
    case 'REQUEST':
    case 'INVITE_ONLY':
    case 'CLOSED':
      return true;
    default:
      return false;
  }
}

function isBotAccessMode(value: unknown): value is DynamicSettingDefinitions['bot_access_mode'] {
  return value === BOT_ACCESS_MODES.private || value === BOT_ACCESS_MODES.public;
}

function isDynamicSettingValue<K extends DynamicSettingKey>(
  key: K,
  value: unknown,
): value is DynamicSettingDefinitions[K] {
  if (key === 'join_mode') {
    return isJoinMode(value);
  }
  if (key === 'bot_access_mode') {
    return isBotAccessMode(value);
  }
  return typeof value === typeof DYNAMIC_SETTING_DEFAULTS[key];
}

export function buildSettingsProvider(settingsService: SettingsService): SettingsProvider {
  return {
    get: async (key: string) => {
      if (!isDynamicSettingKey(key)) return null;
      const result = await settingsService.getDynamic(key);
      return result.isOk() ? result.value : null;
    },
    set: async (key: string, value: unknown, updatedBy: string | null) => {
      if (!isDynamicSettingKey(key) || !isDynamicSettingValue(key, value)) return null;
      const result = await settingsService.setDynamic(key, value, updatedBy);
      return result.isOk() ? undefined : null;
    },
  };
}
