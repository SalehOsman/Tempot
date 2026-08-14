import type { Result } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import type { AppError } from '@tempot/shared';
import type {
  StaticSettings,
  DynamicSettingKey,
  DynamicSettingDefinitions,
  MaintenanceStatus,
} from './settings.types.js';
import type { DynamicSettingsService } from './dynamic-settings.service.js';
import type { MaintenanceService } from './maintenance.service.js';

export class SettingsService {
  constructor(
    private readonly staticResult: Result<StaticSettings, AppError>,
    private readonly dynamicSettings: DynamicSettingsService,
    private readonly maintenanceService: MaintenanceService,
  ) {}

  getStatic(): Result<StaticSettings, AppError> {
    return this.staticResult;
  }

  getDynamic<K extends DynamicSettingKey>(key: K): AsyncResult<DynamicSettingDefinitions[K]> {
    return this.dynamicSettings.get(key);
  }

  setDynamic<K extends DynamicSettingKey>(
    key: K,
    value: DynamicSettingDefinitions[K],
    updatedBy: string | null = null,
  ): AsyncResult<void> {
    return this.dynamicSettings.set(key, value, updatedBy);
  }

  deleteDynamic(key: DynamicSettingKey, deletedBy: string | null = null): AsyncResult<void> {
    return this.dynamicSettings.delete(key, deletedBy);
  }

  getMaintenanceStatus(): AsyncResult<MaintenanceStatus> {
    return this.maintenanceService.getStatus();
  }
}
