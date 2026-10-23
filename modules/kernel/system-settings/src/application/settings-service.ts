import type { CacheInvalidator } from '@tembot/contracts';
import { createChildLogger } from '@tembot/logger';
import type { AuditService } from '@tembot/module-audit-log';
import { and, eq, isNull } from 'drizzle-orm';
import type { PgDatabase } from 'drizzle-orm/pg-core';
import { type Result, err, ok } from 'neverthrow';
import { type SystemSettingsRecord, systemSettings } from '../db/schema.js';
import {
  type BotSurfaceSettings,
  type DashboardSurfaceSettings,
  SettingsError,
  type SurfaceType,
  type TmaSurfaceSettings,
  type UpdateSettingsInput,
} from '../domain/types.js';

const settingsLogger = createChildLogger({ module: 'system-settings', slice: 'service' });

function createDefaultSettingsRecord(tenantId: string): SystemSettingsRecord {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    tenantId,
    platformName: 'Tembot Platform',
    defaultLocale: 'ar',
    isGlobalMaintenance: false,
    globalMaintenanceMessage: null,
    botName: 'Tembot',
    botWelcomeMessage: 'مرحباً بك في المنصة!',
    botHelpMessage: 'قائمة الأوامر المتاحة:...',
    botMaintenanceMode: false,
    tmaTitle: 'Tembot Mini App',
    tmaPrimaryColor: '#2563eb',
    tmaMaintenanceMode: false,
    dashboardLogoUrl: null,
    sessionTimeoutMinutes: 60,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };
}

export interface SettingsServiceConfig {
  readonly cacheTtlMs?: number; // In-memory cache TTL (default: 60,000ms)
  readonly cacheInvalidator?: CacheInvalidator;
  readonly invalidationChannel?: string;
}

export class SettingsService {
  private readonly cache = new Map<string, { data: SystemSettingsRecord; expiresAt: number }>();
  private readonly inMemoryStore = new Map<string, SystemSettingsRecord>();
  private readonly cacheTtlMs: number;
  private readonly cacheInvalidator?: CacheInvalidator;
  private readonly invalidationChannel: string;

  constructor(
    // biome-ignore lint/suspicious/noExplicitAny: Drizzle schema container
    private readonly db?: PgDatabase<any>,
    private readonly auditService?: AuditService,
    config: SettingsServiceConfig = {},
  ) {
    this.cacheTtlMs = config.cacheTtlMs ?? 60_000;
    this.cacheInvalidator = config.cacheInvalidator;
    this.invalidationChannel = config.invalidationChannel ?? 'cache:system-settings';

    if (this.cacheInvalidator) {
      this.cacheInvalidator.subscribeInvalidate(this.invalidationChannel, (tenantId) => {
        this.cache.delete(tenantId);
        settingsLogger.debug({ tenantId }, 'Distributed cache invalidated via pub/sub');
      });
    }
  }

  /**
   * Retrieves system settings for a tenant, utilizing fast in-memory cache.
   */
  async getSettings(tenantId: string): Promise<Result<SystemSettingsRecord, SettingsError>> {
    const cached = this.cache.get(tenantId);
    if (cached && cached.expiresAt > Date.now()) {
      return ok(cached.data);
    }

    if (!this.db) {
      let record = this.inMemoryStore.get(tenantId);
      if (!record) {
        record = createDefaultSettingsRecord(tenantId);
        this.inMemoryStore.set(tenantId, record);
      }
      this.cache.set(tenantId, { data: record, expiresAt: Date.now() + this.cacheTtlMs });
      return ok(record);
    }

    try {
      const records = await this.db
        .select()
        .from(systemSettings)
        .where(and(eq(systemSettings.tenantId, tenantId), isNull(systemSettings.deletedAt)))
        .limit(1);

      if (records.length > 0) {
        const record = records[0];
        this.cache.set(tenantId, { data: record, expiresAt: Date.now() + this.cacheTtlMs });
        return ok(record);
      }

      // Initialize default settings if none exist
      const [newRecord] = await this.db
        .insert(systemSettings)
        .values({
          tenantId,
          platformName: 'Tembot Platform',
          defaultLocale: 'ar',
          botName: 'Tembot',
          botWelcomeMessage: 'مرحباً بك في المنصة!',
          botHelpMessage: 'قائمة الأوامر المتاحة:...',
          tmaTitle: 'Tembot Mini App',
          tmaPrimaryColor: '#2563eb',
          sessionTimeoutMinutes: 60,
        })
        .returning();

      this.cache.set(tenantId, { data: newRecord, expiresAt: Date.now() + this.cacheTtlMs });
      return ok(newRecord);
    } catch (error) {
      settingsLogger.error({ error, tenantId }, 'Failed to fetch system settings');
      return err(
        new SettingsError('FETCH_FAILED', 'Failed to retrieve system settings from database', 500, {
          originalError: String(error),
        }),
      );
    }
  }

  /**
   * Retrieves surface-specific isolated configuration.
   */
  async getSurfaceSettings(
    tenantId: string,
    surface: SurfaceType,
  ): Promise<
    Result<BotSurfaceSettings | TmaSurfaceSettings | DashboardSurfaceSettings, SettingsError>
  > {
    const settingsRes = await this.getSettings(tenantId);
    if (settingsRes.isErr()) return err(settingsRes.error);

    const s = settingsRes.value;

    if (surface === 'bot') {
      const botConfig: BotSurfaceSettings = {
        botName: s.botName,
        welcomeMessage: s.botWelcomeMessage,
        helpMessage: s.botHelpMessage,
        isMaintenance: s.isGlobalMaintenance || s.botMaintenanceMode,
        locale: s.defaultLocale,
      };
      return ok(botConfig);
    }

    if (surface === 'tma') {
      const tmaConfig: TmaSurfaceSettings = {
        title: s.tmaTitle,
        primaryColor: s.tmaPrimaryColor,
        isMaintenance: s.isGlobalMaintenance || s.tmaMaintenanceMode,
        locale: s.defaultLocale,
      };
      return ok(tmaConfig);
    }

    const dashboardConfig: DashboardSurfaceSettings = {
      platformName: s.platformName,
      logoUrl: s.dashboardLogoUrl,
      defaultLocale: s.defaultLocale,
      sessionTimeoutMinutes: s.sessionTimeoutMinutes,
      isMaintenance: s.isGlobalMaintenance,
      isGlobalMaintenance: s.isGlobalMaintenance,
    };
    return ok(dashboardConfig);
  }

  /**
   * Updates system settings, invalidates in-memory cache, and records an immutable audit trail.
   */
  async updateSettings(
    tenantId: string,
    input: UpdateSettingsInput,
    actorId = 'system:operator',
  ): Promise<Result<SystemSettingsRecord, SettingsError>> {
    try {
      const prevRes = await this.getSettings(tenantId);
      const prevState = prevRes.isOk() ? prevRes.value : null;

      if (!this.db) {
        const prev = prevState ?? createDefaultSettingsRecord(tenantId);
        const updated: SystemSettingsRecord = {
          ...prev,
          ...input,
          updatedAt: new Date(),
        };
        this.inMemoryStore.set(tenantId, updated);
        this.cache.delete(tenantId);
        if (this.cacheInvalidator) {
          await this.cacheInvalidator.publishInvalidate(this.invalidationChannel, tenantId);
        }
        return ok(updated);
      }

      const [updated] = await this.db
        .update(systemSettings)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(and(eq(systemSettings.tenantId, tenantId), isNull(systemSettings.deletedAt)))
        .returning();

      // Invalidate cache immediately
      this.cache.delete(tenantId);

      if (this.cacheInvalidator) {
        await this.cacheInvalidator.publishInvalidate(this.invalidationChannel, tenantId);
      }

      settingsLogger.info({ tenantId, actorId, input }, 'System settings updated');

      if (this.auditService) {
        await this.auditService.record({
          tenantId,
          actorId,
          actorType: 'admin',
          action: 'settings.updated',
          entityType: 'system_settings',
          entityId: updated.id,
          payload: {
            diff: input,
            before: prevState,
          },
        });
      }

      return ok(updated);
    } catch (error) {
      settingsLogger.error({ error, tenantId, input }, 'Failed to update system settings');
      return err(
        new SettingsError('UPDATE_FAILED', 'Failed to update system settings in database', 500, {
          originalError: String(error),
        }),
      );
    }
  }

  /**
   * Fast synchronous check for surface maintenance status.
   */
  async isMaintenanceActive(tenantId: string, surface: SurfaceType): Promise<boolean> {
    const res = await this.getSurfaceSettings(tenantId, surface);
    if (res.isErr()) return false;
    return res.value.isMaintenance;
  }
}
