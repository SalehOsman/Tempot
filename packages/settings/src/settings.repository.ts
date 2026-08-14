import { ok, err } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import type { DynamicSettingRecord } from './settings.types.js';
import { SETTINGS_ERRORS } from './settings.errors.js';

/** Typed Prisma delegate for the Setting model (DC-7) */
export interface SettingDelegate {
  findUnique(args: { where: { key: string } }): Promise<DynamicSettingRecord | null>;
  findMany(): Promise<DynamicSettingRecord[]>;
  upsert(args: {
    where: { key: string };
    create: { key: string; value: string; createdBy: string | null; updatedBy: string | null };
    update: { value: string; updatedBy: string | null };
  }): Promise<DynamicSettingRecord>;
  delete(args: { where: { key: string } }): Promise<DynamicSettingRecord>;
}

/** Typed Prisma client subset for settings (DC-7) */
export interface SettingsPrismaClient {
  setting: SettingDelegate;
}

/** Port interface for settings repository (Rule XIV) */
export interface SettingsRepositoryPort {
  findByKey(key: string): AsyncResult<DynamicSettingRecord | null>;
  findAll(): AsyncResult<DynamicSettingRecord[]>;
  upsert(key: string, value: string, updatedBy: string | null): AsyncResult<DynamicSettingRecord>;
  deleteByKey(key: string): AsyncResult<DynamicSettingRecord>;
}

/** Prisma-based repository for dynamic settings */
export class SettingsRepository implements SettingsRepositoryPort {
  constructor(private readonly prisma: SettingsPrismaClient) {}

  async findByKey(key: string): AsyncResult<DynamicSettingRecord | null> {
    try {
      const result = await this.prisma.setting.findUnique({ where: { key } });
      return ok(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new AppError(SETTINGS_ERRORS.REPOSITORY_ERROR, message));
    }
  }

  async findAll(): AsyncResult<DynamicSettingRecord[]> {
    try {
      const results = await this.prisma.setting.findMany();
      return ok(results);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new AppError(SETTINGS_ERRORS.REPOSITORY_ERROR, message));
    }
  }

  async upsert(
    key: string,
    value: string,
    updatedBy: string | null,
  ): AsyncResult<DynamicSettingRecord> {
    try {
      const result = await this.prisma.setting.upsert({
        where: { key },
        update: { value, updatedBy },
        create: { key, value, createdBy: updatedBy, updatedBy },
      });
      return ok(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new AppError(SETTINGS_ERRORS.REPOSITORY_ERROR, message));
    }
  }

  async deleteByKey(key: string): AsyncResult<DynamicSettingRecord> {
    try {
      const result = await this.prisma.setting.delete({ where: { key } });
      return ok(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new AppError(SETTINGS_ERRORS.REPOSITORY_ERROR, message));
    }
  }
}
