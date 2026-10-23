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

export interface SettingsServiceConfig {
  readonly cacheTtlMs?: number; // In-memory cache TTL (default: 60,000ms)
}

export class SettingsService {
  private readonly cache = new Map<string, { data: SystemSettingsRecord; expiresAt: number }>();
  private readonly cacheTtlMs: number;

  constructor(
    // biome-ignore lint/suspicious/noExplicitAny: Drizzle schema container
    private readonly db: PgDatabase<any>,
    private readonly auditService?: AuditService,
    config: SettingsServiceConfig = {},
  ) {
    this.cacheTtlMs = config.cacheTtlMs ?? 60_000;
  }

  /**
   * Retrieves system settings for a tenant, utilizing fast in-memory cache.
   */
  async getSettings(tenantId: string): Promise<Result<SystemSettingsRecord, SettingsError>> {
    const cached = this.cache.get(tenantId);
    if (cached && cached.expiresAt > Date.now()) {
      return ok(cached.data);
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
