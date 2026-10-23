import type { RenderedRichMessage } from '@tembot/core-components';
import { type Result, err, ok } from 'neverthrow';
import type { SettingsService } from '../application/settings-service.js';
import { SettingsError } from '../domain/types.js';
import {
  SETTINGS_CALLBACKS,
  renderLocaleSelectionPage,
  renderMainSettingsPage,
  renderMaintenanceConfirmCard,
  renderMaintenanceMenuPage,
} from './settings-keyboard.js';

export interface TelegramSettingsContext {
  readonly tenantId: string;
  readonly actorId: string;
  readonly isOperator: boolean;
  readonly isRtl?: boolean;
}

export class TelegramSettingsRouter {
  constructor(private readonly settingsService: SettingsService) {}

  /**
   * Handles button click or callback query and produces the appropriate Rich Message.
   */
  async handleCallback(
    callbackData: string,
    ctx: TelegramSettingsContext,
  ): Promise<Result<RenderedRichMessage | null, SettingsError>> {
    // 1. Navigation to Main Settings
    if (callbackData === SETTINGS_CALLBACKS.MAIN) {
      const res = await this.settingsService.getSettings(ctx.tenantId);
      if (res.isErr()) return err(res.error);
      const isRtl = ctx.isRtl ?? res.value.defaultLocale === 'ar';
      return ok(renderMainSettingsPage(res.value, isRtl));
    }

    // 2. Navigation to Locale Menu
    if (callbackData === SETTINGS_CALLBACKS.LOCALE_MENU) {
      const res = await this.settingsService.getSettings(ctx.tenantId);
      if (res.isErr()) return err(res.error);
      const isRtl = ctx.isRtl ?? res.value.defaultLocale === 'ar';
      return ok(renderLocaleSelectionPage(res.value.defaultLocale, isRtl));
    }

    // 3. Set Locale Actions (INC-20261023-02: Isolated per-user preference)
    if (
      callbackData === SETTINGS_CALLBACKS.SET_LOCALE_AR ||
      callbackData === SETTINGS_CALLBACKS.SET_LOCALE_EN
    ) {
      const targetLocale = callbackData === SETTINGS_CALLBACKS.SET_LOCALE_AR ? 'ar' : 'en';
      if (ctx.actorId.startsWith('tg:')) {
        const tgUserId = ctx.actorId.replace('tg:', '');
        await this.settingsService.setUserLocale(ctx.tenantId, tgUserId, targetLocale);
      }
      const settingsRes = await this.settingsService.getSettings(ctx.tenantId);
      if (settingsRes.isErr()) return err(settingsRes.error);
      const isRtl = targetLocale === 'ar';
      return ok(renderMainSettingsPage(settingsRes.value, isRtl));
    }

    // 4. Navigation to Maintenance Menu
    if (callbackData === SETTINGS_CALLBACKS.MAINT_MENU) {
      const res = await this.settingsService.getSettings(ctx.tenantId);
      if (res.isErr()) return err(res.error);
      const isRtl = ctx.isRtl ?? res.value.defaultLocale === 'ar';
      return ok(renderMaintenanceMenuPage(res.value, isRtl));
    }

    // 5. Toggle Maintenance Initiation (requires confirmation)
    if (
      callbackData === SETTINGS_CALLBACKS.TOGGLE_MAINT_BOT ||
      callbackData === SETTINGS_CALLBACKS.TOGGLE_MAINT_TMA ||
      callbackData === SETTINGS_CALLBACKS.TOGGLE_MAINT_GLOBAL
    ) {
      if (!ctx.isOperator) {
        return err(
          new SettingsError(
            'FORBIDDEN',
            'Only platform operators can toggle maintenance mode',
            403,
          ),
        );
      }

      const res = await this.settingsService.getSettings(ctx.tenantId);
      if (res.isErr()) return err(res.error);
      const s = res.value;
      const isRtl = ctx.isRtl ?? s.defaultLocale === 'ar';

      if (callbackData === SETTINGS_CALLBACKS.TOGGLE_MAINT_BOT) {
        return ok(renderMaintenanceConfirmCard('bot', !s.botMaintenanceMode, isRtl));
      }
      if (callbackData === SETTINGS_CALLBACKS.TOGGLE_MAINT_TMA) {
        return ok(renderMaintenanceConfirmCard('tma', !s.tmaMaintenanceMode, isRtl));
      }
      return ok(renderMaintenanceConfirmCard('all', !s.isGlobalMaintenance, isRtl));
    }

    // 6. Confirmed Maintenance State Execution
    if (callbackData.startsWith(SETTINGS_CALLBACKS.CONFIRM_PREFIX)) {
      if (!ctx.isOperator) {
        return err(
          new SettingsError(
            'FORBIDDEN',
            'Only platform operators can confirm maintenance mode',
            403,
          ),
        );
      }

      const parts = callbackData.replace(SETTINGS_CALLBACKS.CONFIRM_PREFIX, '').split(':');
      const surface = parts[0];
      const newState = parts[1] === 'on';

      let updatePayload: Parameters<SettingsService['updateSettings']>[1];
      if (surface === 'bot') {
        updatePayload = { botMaintenanceMode: newState };
      } else if (surface === 'tma') {
        updatePayload = { tmaMaintenanceMode: newState };
      } else {
        updatePayload = { isGlobalMaintenance: newState };
      }

      const updateRes = await this.settingsService.updateSettings(
        ctx.tenantId,
        updatePayload,
        ctx.actorId,
      );
      if (updateRes.isErr()) return err(updateRes.error);
      const isRtl = ctx.isRtl ?? updateRes.value.defaultLocale === 'ar';
      return ok(renderMaintenanceMenuPage(updateRes.value, isRtl));
    }

    // 7. Close message
    if (callbackData === SETTINGS_CALLBACKS.CLOSE) {
      return ok(null);
    }

    return err(
      new SettingsError('UNKNOWN_CALLBACK', `Unknown settings callback: ${callbackData}`, 400),
    );
  }
}
