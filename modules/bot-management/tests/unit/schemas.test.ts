import { describe, expect, it } from 'vitest';
import { botProfileSchema, exportedBotProfileSchema } from '../../contracts/bot-profile.schema.js';
import { moduleEnablementSchema } from '../../contracts/module-enablement.schema.js';
import { botSettingsProfileSchema } from '../../contracts/settings-profile.schema.js';
import { botProfileImportSchema } from '../../contracts/import-export.schema.js';
import { BotLifecycleStatus } from '../../types/lifecycle.types.js';
import { BotModuleEnablementState } from '../../types/module-enablement.types.js';
import { BotRuntimeMode } from '../../types/bot.types.js';

const baseBotProfile = {
  displayName: 'Main Support Bot',
  telegramUsername: 'main_support_bot',
  tokenFingerprint: 'fingerprint-123',
  tokenRedacted: '12345:********',
  ownerId: 'user-1',
  runtimeMode: BotRuntimeMode.WEBHOOK,
  status: BotLifecycleStatus.DRAFT,
  defaultLocale: 'en',
  defaultCountry: 'US',
  timezone: 'UTC',
};

describe('bot profile schemas', () => {
  it('accepts a valid bot profile command payload', () => {
    const result = botProfileSchema.safeParse(baseBotProfile);
    expect(result.success).toBe(true);
  });

  it('rejects exported profiles that include raw credentials', () => {
    const result = exportedBotProfileSchema.safeParse({
      schema: 'tempot-bot-profile/1.0',
      exportedAt: '2026-05-12T00:00:00.000Z',
      bot: {
        ...baseBotProfile,
        rawToken: '12345:secret',
      },
      settings: {
        locale: 'en',
        country: 'US',
        timezone: 'UTC',
        notificationsEnabled: true,
        privacyMode: 'standard',
        featureToggles: {},
      },
      modules: [],
      credentialSetupRequired: true,
    });

    expect(result.success).toBe(false);
  });
});

describe('settings profile schema', () => {
  it('accepts per-bot settings with structured feature toggles', () => {
    const result = botSettingsProfileSchema.safeParse({
      locale: 'ar',
      country: 'EG',
      timezone: 'Africa/Cairo',
      notificationsEnabled: true,
      privacyMode: 'strict',
      featureToggles: { orders: true },
    });
    expect(result.success).toBe(true);
  });
});

describe('module enablement schema', () => {
  it('accepts enabled module state with actor metadata', () => {
    const result = moduleEnablementSchema.safeParse({
      moduleName: 'user-management',
      state: BotModuleEnablementState.ENABLED,
      enabledBy: 'admin-1',
      enabledAt: '2026-05-12T00:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('requires a blocked reason when module state is BLOCKED', () => {
    const result = moduleEnablementSchema.safeParse({
      moduleName: 'template-management',
      state: BotModuleEnablementState.BLOCKED,
    });
    expect(result.success).toBe(false);
  });

  it('accepts explicit unavailable state without silently enabling the module', () => {
    const result = moduleEnablementSchema.safeParse({
      moduleName: 'missing-module',
      state: BotModuleEnablementState.UNAVAILABLE,
    });
    expect(result.success).toBe(true);
  });
});

describe('import profile schema', () => {
  it('requires imported profiles to target DRAFT status', () => {
    const result = botProfileImportSchema.safeParse({
      sourceProfile: {
        schema: 'tempot-bot-profile/1.0',
        exportedAt: '2026-05-12T00:00:00.000Z',
        bot: baseBotProfile,
        settings: {
          locale: 'en',
          country: 'US',
          timezone: 'UTC',
          notificationsEnabled: true,
          privacyMode: 'standard',
          featureToggles: {},
        },
        modules: [],
        credentialSetupRequired: true,
      },
      targetStatus: BotLifecycleStatus.ACTIVE,
    });

    expect(result.success).toBe(false);
  });
});
