import { describe, expect, it } from 'vitest';
import { ok, err, type Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import {
  SettingsProfileService,
  type SettingsProfileRepositoryPort,
} from '../../services/settings-profile.service.js';
import type { BotSettingsProfile } from '../../types/settings.types.js';
import { BOT_MANAGEMENT_EVENTS } from '../../events/event-names.js';

const profile: BotSettingsProfile = {
  id: 'settings-1',
  botId: 'bot-1',
  locale: 'ar-EG',
  country: 'EG',
  timezone: 'Africa/Cairo',
  notificationsEnabled: true,
  privacyMode: 'standard',
  featureToggles: {},
  createdAt: new Date('2026-05-12T00:00:00.000Z'),
  updatedAt: new Date('2026-05-12T00:00:00.000Z'),
};

function repository(): SettingsProfileRepositoryPort {
  let record = profile;
  return {
    findByBotId: async () => ok(record),
    upsertForBot: async (_botId, data) => {
      record = { ...record, ...data };
      return ok(record);
    },
  };
}

function eventBus() {
  const events: { event: string; payload: Record<string, unknown> }[] = [];
  return {
    events,
    publish: async (
      event: string,
      payload: Record<string, unknown>,
    ): Promise<Result<void, AppError>> => {
      events.push({ event, payload });
      return ok(undefined);
    },
  };
}

describe('SettingsProfileService', () => {
  it('updates a settings profile and publishes changed fields', async () => {
    const bus = eventBus();
    const service = new SettingsProfileService(repository(), bus);

    const result = await service.update(
      'bot-1',
      {
        locale: 'en-US',
        country: 'US',
        timezone: 'UTC',
        notificationsEnabled: false,
        privacyMode: 'strict',
        featureToggles: { templates: true },
      },
      'admin-1',
    );

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap().privacyMode).toBe('strict');
    expect(bus.events[0]?.event).toBe(BOT_MANAGEMENT_EVENTS.SETTINGS_CHANGED);
  });

  it('rejects invalid settings before persistence', async () => {
    const failingRepo: SettingsProfileRepositoryPort = {
      findByBotId: async () => err(new AppError('unexpected_call')),
      upsertForBot: async () => err(new AppError('unexpected_call')),
    };
    const service = new SettingsProfileService(failingRepo, eventBus());

    const result = await service.update(
      'bot-1',
      {
        locale: '',
        country: 'EG',
        timezone: 'Africa/Cairo',
        notificationsEnabled: true,
        privacyMode: 'standard',
        featureToggles: {},
      },
      'admin-1',
    );

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('bot-management.invalid_settings');
  });
});
