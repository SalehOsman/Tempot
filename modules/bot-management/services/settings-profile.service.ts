import { AppError } from '@tempot/shared';
import { ok, err, type Result } from 'neverthrow';
import { botSettingsProfileSchema } from '../contracts/settings-profile.schema.js';
import type { BotSettingsProfile, BotSettingsProfileInput } from '../types/settings.types.js';
import { BOT_MANAGEMENT_EVENTS } from '../events/event-names.js';

export interface SettingsProfileRepositoryPort {
  findByBotId: (botId: string) => Promise<Result<BotSettingsProfile, AppError>>;
  upsertForBot: (
    botId: string,
    data: Record<string, unknown>,
  ) => Promise<Result<BotSettingsProfile, AppError>>;
}

export interface SettingsEventBusPort {
  publish: (event: string, payload: Record<string, unknown>) => Promise<unknown>;
}

export class SettingsProfileService {
  constructor(
    private readonly repository: SettingsProfileRepositoryPort,
    private readonly eventBus: SettingsEventBusPort,
  ) {}

  async get(botId: string): Promise<Result<BotSettingsProfile, AppError>> {
    return this.repository.findByBotId(botId);
  }

  async update(
    botId: string,
    input: BotSettingsProfileInput,
    actorId: string,
  ): Promise<Result<BotSettingsProfile, AppError>> {
    const validation = botSettingsProfileSchema.safeParse(input);
    if (!validation.success) {
      return err(new AppError('bot-management.invalid_settings', validation.error.flatten()));
    }

    const result = await this.repository.upsertForBot(botId, validation.data);
    if (result.isErr()) return err(result.error);

    const published = await this.publishChange(botId, actorId, Object.keys(validation.data));
    return published.isErr() ? err(published.error) : ok(result.value);
  }

  private async publishChange(
    botId: string,
    actorId: string,
    changedFields: string[],
  ): Promise<Result<void, AppError>> {
    const result = await this.eventBus.publish(BOT_MANAGEMENT_EVENTS.SETTINGS_CHANGED, {
      botId,
      actorId,
      changedFields,
      timestamp: new Date(),
    });
    if (this.isFailedPublish(result))
      return err(new AppError('bot-management.event_publish_failed'));
    return ok(undefined);
  }

  private isFailedPublish(value: unknown): boolean {
    return typeof value === 'object' && value !== null && 'isOk' in value
      ? !(value as { isOk: () => boolean }).isOk()
      : false;
  }
}
