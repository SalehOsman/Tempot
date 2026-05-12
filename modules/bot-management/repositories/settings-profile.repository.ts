import { AppError } from '@tempot/shared';
import { ok, err, type Result } from 'neverthrow';
import type { BotSettingsProfile } from '../types/settings.types.js';
import { ModuleBaseRepository } from './module-base.repository.js';

export class SettingsProfileRepository extends ModuleBaseRepository<BotSettingsProfile> {
  protected moduleName = 'bot-management';
  protected entityName = 'botSettingsProfile';

  protected get model() {
    return (this.db as unknown as Record<string, object>)['botSettingsProfile'];
  }

  async findByBotId(botId: string): Promise<Result<BotSettingsProfile, AppError>> {
    const result = await this.findMany({ botId });
    if (result.isErr()) return err(result.error);
    const profile = result.value[0];
    return profile ? ok(profile) : err(new AppError('bot-management.settings_not_found'));
  }

  async upsertForBot(
    botId: string,
    data: Record<string, unknown>,
  ): Promise<Result<BotSettingsProfile, AppError>> {
    const existing = await this.findByBotId(botId);
    if (existing.isOk()) return this.update(existing.value.id, data);

    return this.create({
      id: `settings-${crypto.randomUUID()}`,
      botId,
      locale: data['locale'] ?? 'ar-EG',
      country: data['country'] ?? 'EG',
      timezone: data['timezone'] ?? 'Africa/Cairo',
      notificationsEnabled: data['notificationsEnabled'] ?? true,
      privacyMode: data['privacyMode'] ?? 'standard',
      featureToggles: data['featureToggles'] ?? {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}
