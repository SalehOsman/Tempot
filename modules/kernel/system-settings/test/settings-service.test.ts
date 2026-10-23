import type { AuditService } from '@tembot/module-audit-log';
import { ok } from '@tembot/shared-types';
import type { PgDatabase } from 'drizzle-orm/pg-core';
import { describe, expect, it, vi } from 'vitest';
import { SettingsService } from '../src/application/settings-service.js';
import type { SystemSettingsRecord } from '../src/db/schema.js';
import {
  SETTINGS_CALLBACKS,
  buildPersistentReplyKeyboard,
} from '../src/telegram/settings-keyboard.js';
import { TelegramSettingsRouter } from '../src/telegram/settings-router.js';

describe('SettingsService & Telegram Flow Specification', () => {
  const mockRecord: SystemSettingsRecord = {
    id: '00000000-0000-0000-0000-000000000001',
    tenantId: '00000000-0000-0000-0000-000000000000',
    platformName: 'Tembot Platform',
    defaultLocale: 'ar',
    isGlobalMaintenance: false,
    globalMaintenanceMessage: null,
    botName: 'Tembot',
    botWelcomeMessage: 'مرحباً بك!',
    botHelpMessage: 'المساعدة',
    botMaintenanceMode: false,
    tmaTitle: 'TMA App',
    tmaPrimaryColor: '#2563eb',
    tmaMaintenanceMode: false,
    dashboardLogoUrl: null,
    sessionTimeoutMinutes: 60,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const createMockDb = (initialRecord: SystemSettingsRecord | null = mockRecord) => {
    let current = initialRecord ? { ...initialRecord } : null;

    return {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: async () => (current ? [current] : []),
          }),
        }),
      }),
      insert: () => ({
        values: (val: Record<string, unknown>) => ({
          returning: async () => {
            current = { ...mockRecord, ...val } as SystemSettingsRecord;
            return [current];
          },
        }),
      }),
      update: () => ({
        set: (val: Record<string, unknown>) => ({
          where: () => ({
            returning: async () => {
              if (current) Object.assign(current, val);
              return [current];
            },
          }),
        }),
      }),
    } as unknown as PgDatabase<Record<string, never>>;
  };

  it('retrieves cached settings and isolates surface-specific configurations', async () => {
    const mockDb = createMockDb();
    const service = new SettingsService(mockDb);

    const botConfigRes = await service.getSurfaceSettings(
      '00000000-0000-0000-0000-000000000000',
      'bot',
    );
    expect(botConfigRes.isOk()).toBe(true);
    if (botConfigRes.isOk()) {
      expect(botConfigRes.value.botName).toBe('Tembot');
      expect(botConfigRes.value.isMaintenance).toBe(false);
    }

    const tmaConfigRes = await service.getSurfaceSettings(
      '00000000-0000-0000-0000-000000000000',
      'tma',
    );
    expect(tmaConfigRes.isOk()).toBe(true);
    if (tmaConfigRes.isOk()) {
      expect(tmaConfigRes.value.title).toBe('TMA App');
      expect(tmaConfigRes.value.primaryColor).toBe('#2563eb');
    }
  });

  it('updates settings and records an immutable audit log entry', async () => {
    const mockDb = createMockDb();
    const recordMock = vi.fn().mockResolvedValue(ok({ id: 'audit-1' }));
    const mockAuditService = { record: recordMock } as unknown as AuditService;

    const service = new SettingsService(mockDb, mockAuditService);

    const updateRes = await service.updateSettings(
      '00000000-0000-0000-0000-000000000000',
      { defaultLocale: 'en', botMaintenanceMode: true },
      'admin:saleh',
    );

    expect(updateRes.isOk()).toBe(true);
    expect(recordMock).toHaveBeenCalledTimes(1);

    const auditCall = recordMock.mock.calls[0][0];
    expect(auditCall.action).toBe('settings.updated');
    expect(auditCall.actorId).toBe('admin:saleh');
    expect(auditCall.payload.diff.defaultLocale).toBe('en');
  });

  it('generates a persistent bottom reply keyboard with settings button', () => {
    const kb = buildPersistentReplyKeyboard({ tmaUrl: 'https://tma.tembot.dev', isRtl: true });
    expect(kb.resize_keyboard).toBe(true);
    expect(kb.is_persistent).toBe(true);
    expect(kb.keyboard[0][1].text).toBe('⚙️ الإعدادات');
  });

  it('routes Telegram settings callbacks to rich message pages with valid mobile budgets', async () => {
    const mockDb = createMockDb();
    const service = new SettingsService(mockDb);
    const router = new TelegramSettingsRouter(service);

    const mainRes = await router.handleCallback(SETTINGS_CALLBACKS.MAIN, {
      tenantId: '00000000-0000-0000-0000-000000000000',
      actorId: 'user:123',
      isOperator: false,
    });

    expect(mainRes.isOk()).toBe(true);
    if (mainRes.isOk() && mainRes.value) {
      expect(mainRes.value.text).toContain('⚙️');
      expect(mainRes.value.parseMode).toBe('HTML');
      expect(mainRes.value.buttons).toBeDefined();
    }
  });

  it('blocks non-operators from toggling maintenance mode with Forbidden error', async () => {
    const mockDb = createMockDb();
    const service = new SettingsService(mockDb);
    const router = new TelegramSettingsRouter(service);

    const res = await router.handleCallback(SETTINGS_CALLBACKS.TOGGLE_MAINT_BOT, {
      tenantId: '00000000-0000-0000-0000-000000000000',
      actorId: 'regular_user:123',
      isOperator: false,
    });

    expect(res.isErr()).toBe(true);
    if (res.isErr()) {
      expect(res.error.httpStatus).toBe(403);
    }
  });
});
