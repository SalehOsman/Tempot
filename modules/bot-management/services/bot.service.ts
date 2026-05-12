import { createHash } from 'node:crypto';
import { AppError } from '@tempot/shared';
import { ok, err, type Result } from 'neverthrow';
import { BotRuntimeMode, BotHealthStatus, type ManagedBot } from '../types/bot.types.js';
import { BotLifecycleStatus } from '../types/lifecycle.types.js';
import { BOT_MANAGEMENT_EVENTS } from '../events/event-names.js';

const BOT_LIST_PAGE_SIZE = 5;
const TOKEN_PREFIX_LENGTH = 7;
const TOKEN_SUFFIX_LENGTH = 4;

export interface RegisterManagedBotInput {
  displayName: string;
  telegramUsername: string;
  token: string;
  ownerId: string;
  runtimeMode: BotRuntimeMode;
  defaultLocale: string;
  defaultCountry: string;
  timezone: string;
}

export interface BotListResult {
  bots: ManagedBot[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface BotRepositoryPort {
  create: (data: Record<string, unknown>) => Promise<Result<ManagedBot, AppError>>;
  findById: (id: string) => Promise<Result<ManagedBot, AppError>>;
  findByTelegramUsername: (username: string) => Promise<Result<ManagedBot, AppError>>;
  list: (
    page: number,
    pageSize: number,
  ) => Promise<Result<Omit<BotListResult, 'page' | 'pageSize'>, AppError>>;
  update: (id: string, data: Record<string, unknown>) => Promise<Result<ManagedBot, AppError>>;
}

export interface BotEventBusPort {
  publish: (event: string, payload: Record<string, unknown>) => Promise<unknown>;
}

export class BotService {
  constructor(
    private readonly repository: BotRepositoryPort,
    private readonly eventBus: BotEventBusPort,
  ) {}

  async register(
    input: RegisterManagedBotInput,
    actorId: string,
  ): Promise<Result<ManagedBot, AppError>> {
    const duplicate = await this.repository.findByTelegramUsername(input.telegramUsername);
    if (duplicate.isOk()) {
      return err(
        new AppError('bot-management.duplicate_username', { username: input.telegramUsername }),
      );
    }

    const result = await this.repository.create({
      displayName: input.displayName,
      telegramUsername: input.telegramUsername,
      tokenFingerprint: this.fingerprint(input.token),
      tokenRedacted: this.redactToken(input.token),
      ownerId: input.ownerId,
      runtimeMode: input.runtimeMode,
      status: BotLifecycleStatus.DRAFT,
      defaultLocale: input.defaultLocale,
      defaultCountry: input.defaultCountry,
      timezone: input.timezone,
      healthStatus: BotHealthStatus.UNKNOWN,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
    });
    if (result.isErr()) return err(result.error);

    const published = await this.publish(BOT_MANAGEMENT_EVENTS.BOT_REGISTERED, {
      botId: result.value.id,
      actorId,
      telegramUsername: input.telegramUsername,
      timestamp: new Date(),
    });
    if (published.isErr()) return err(published.error);

    return ok(result.value);
  }

  async getDetail(botId: string): Promise<Result<ManagedBot, AppError>> {
    return this.repository.findById(botId);
  }

  async list(page: number = 0): Promise<Result<BotListResult, AppError>> {
    const result = await this.repository.list(page, BOT_LIST_PAGE_SIZE);
    return result.map((value) => ({ ...value, page, pageSize: BOT_LIST_PAGE_SIZE }));
  }

  async archive(
    botId: string,
    actorId: string,
    reason: string,
  ): Promise<Result<ManagedBot, AppError>> {
    if (reason.trim().length === 0) {
      return err(new AppError('bot-management.missing_reason'));
    }
    const result = await this.repository.update(botId, {
      status: BotLifecycleStatus.ARCHIVED,
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: actorId,
    });
    if (result.isErr()) return err(result.error);

    const published = await this.publish(BOT_MANAGEMENT_EVENTS.LIFECYCLE_CHANGED, {
      botId,
      actorId,
      reason,
      toStatus: BotLifecycleStatus.ARCHIVED,
      timestamp: new Date(),
    });
    return published.isErr() ? err(published.error) : ok(result.value);
  }

  private fingerprint(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private redactToken(token: string): string {
    return `${token.slice(0, TOKEN_PREFIX_LENGTH)}...${token.slice(-TOKEN_SUFFIX_LENGTH)}`;
  }

  private async publish(
    event: string,
    payload: Record<string, unknown>,
  ): Promise<Result<void, AppError>> {
    const result = await this.eventBus.publish(event, payload);
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
