import { ok } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import type { MaintenanceStatus, StaticSettings } from './settings.types.js';
import type { DynamicSettingsService } from './dynamic-settings.service.js';

export class MaintenanceService {
  constructor(
    private readonly dynamicSettings: DynamicSettingsService,
    private readonly staticSettings: StaticSettings,
  ) {}

  async getStatus(): AsyncResult<MaintenanceStatus> {
    const enabledResult = await this.dynamicSettings.get('maintenance_mode');

    const enabled = enabledResult.isOk() ? enabledResult.value : false;

    const superAdminIds = this.staticSettings.superAdminIds;

    return ok({
      enabled,
      isSuperAdmin: (userId: number) => superAdminIds.includes(userId),
    });
  }
}
