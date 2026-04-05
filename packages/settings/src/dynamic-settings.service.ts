import { ok, err } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import type {
  DynamicSettingKey,
  DynamicSettingDefinitions,
  DynamicSettingsServiceDeps,
} from './settings.types.js';
import { DYNAMIC_SETTING_DEFAULTS } from './settings.types.js';
import { SETTINGS_ERRORS } from './settings.errors.js';

const CACHE_PREFIX = 'settings:';
const CACHE_TTL_MS = 300_000; // 5 minutes
const VALID_KEYS = new Set<string>(Object.keys(DYNAMIC_SETTING_DEFAULTS));

function validateKey(key: string): boolean {
  return VALID_KEYS.has(key);
}

export class DynamicSettingsService {
  private readonly deps: DynamicSettingsServiceDeps;

  constructor(deps: DynamicSettingsServiceDeps) {
    this.deps = deps;
  }

  async get<K extends DynamicSettingKey>(key: K): AsyncResult<DynamicSettingDefinitions[K]> {
    if (!validateKey(key)) {
      return err(new AppError(SETTINGS_ERRORS.DYNAMIC_UNKNOWN_KEY, { key }));
    }

    const cacheKey = `${CACHE_PREFIX}${key}`;
    const cacheResult = await this.deps.cache.get<string>(cacheKey);

    if (cacheResult.isOk() && cacheResult.value != null) {
      return ok(JSON.parse(cacheResult.value) as DynamicSettingDefinitions[K]);
    }
    if (cacheResult.isErr()) {
      this.deps.logger.warn({
        key,
        error: cacheResult.error.code,
        message: 'Cache read failed, falling through to DB',
      });
    }

    return this.getFromDb(key, cacheKey);
  }

  private async getFromDb<K extends DynamicSettingKey>(
    key: K,
    cacheKey: string,
  ): AsyncResult<DynamicSettingDefinitions[K]> {
    const dbResult = await this.deps.repository.findByKey(key);

    if (dbResult.isErr()) {
      this.deps.logger.warn({
        key,
        error: dbResult.error.code,
        message: 'DB read failed, returning default',
      });
      return ok(DYNAMIC_SETTING_DEFAULTS[key]);
    }
    if (dbResult.value === null) {
      return ok(DYNAMIC_SETTING_DEFAULTS[key]);
    }

    const parsedValue = JSON.parse(dbResult.value.value) as DynamicSettingDefinitions[K];
    const setCacheResult = await this.deps.cache.set(cacheKey, dbResult.value.value, CACHE_TTL_MS);
    if (setCacheResult.isErr()) {
      this.deps.logger.warn({ key, message: 'Failed to populate cache after DB read' });
    }
    return ok(parsedValue);
  }

  async set<K extends DynamicSettingKey>(
    key: K,
    value: DynamicSettingDefinitions[K],
    updatedBy: string | null = null,
  ): AsyncResult<void> {
    if (!validateKey(key)) {
      return err(new AppError(SETTINGS_ERRORS.DYNAMIC_UNKNOWN_KEY, { key }));
    }

    const existingResult = await this.deps.repository.findByKey(key);
    const existed = existingResult.isOk() && existingResult.value !== null;
    const oldValue =
      existed && existingResult.isOk()
        ? (JSON.parse(existingResult.value!.value) as unknown)
        : DYNAMIC_SETTING_DEFAULTS[key];

    const upsertResult = await this.deps.repository.upsert(key, JSON.stringify(value), updatedBy);
    if (upsertResult.isErr()) {
      return err(new AppError(SETTINGS_ERRORS.DYNAMIC_UPDATE_FAILED, upsertResult.error));
    }

    await this.invalidateCache(key);
    await this.emitSetEvents({ key, oldValue, newValue: value, changedBy: updatedBy, existed });
    return ok(undefined);
  }

  async delete(key: DynamicSettingKey, deletedBy: string | null = null): AsyncResult<void> {
    if (!validateKey(key)) {
      return err(new AppError(SETTINGS_ERRORS.DYNAMIC_UNKNOWN_KEY, { key }));
    }

    const existingResult = await this.deps.repository.findByKey(key);
    const oldValue =
      existingResult.isOk() && existingResult.value !== null
        ? (JSON.parse(existingResult.value.value) as unknown)
        : DYNAMIC_SETTING_DEFAULTS[key];

    const deleteResult = await this.deps.repository.deleteByKey(key);
    if (deleteResult.isErr()) {
      return err(new AppError(SETTINGS_ERRORS.DYNAMIC_DELETE_FAILED, deleteResult.error));
    }

    await this.invalidateCache(key);
    await this.emitEvent('settings.setting.deleted', {
      key,
      oldValue,
      newValue: DYNAMIC_SETTING_DEFAULTS[key],
      changedBy: deletedBy,
    });
    return ok(undefined);
  }

  private async invalidateCache(key: string): Promise<void> {
    const delResult = await this.deps.cache.del(`${CACHE_PREFIX}${key}`);
    if (delResult.isErr()) {
      this.deps.logger.warn({ key, message: 'Cache invalidation failed' });
    }
  }

  private async emitEvent(eventName: string, payload: unknown): Promise<void> {
    const result = await this.deps.eventBus.publish(eventName, payload);
    if (result.isErr()) {
      this.deps.logger.warn({
        event: eventName,
        error: result.error.code,
        message: 'Event emission failed',
      });
    }
  }

  private async emitSetEvents(opts: {
    key: DynamicSettingKey;
    oldValue: unknown;
    newValue: unknown;
    changedBy: string | null;
    existed: boolean;
  }): Promise<void> {
    const eventName = opts.existed ? 'settings.setting.updated' : 'settings.setting.created';
    await this.emitEvent(eventName, {
      key: opts.key,
      oldValue: opts.oldValue,
      newValue: opts.newValue,
      changedBy: opts.changedBy,
    });
    if (opts.key === 'maintenance_mode') {
      await this.emitEvent('settings.maintenance.toggled', {
        enabled: opts.newValue as boolean,
        changedBy: opts.changedBy,
      });
    }
  }
}
