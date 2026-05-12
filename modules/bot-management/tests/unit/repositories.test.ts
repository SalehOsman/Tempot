import { describe, expect, it } from 'vitest';
import type { IAuditLogger } from '@tempot/database';
import { BotLifecycleStatus } from '../../types/lifecycle.types.js';
import { BotHealthStatus } from '../../types/bot.types.js';
import { BotModuleEnablementState } from '../../types/module-enablement.types.js';
import { SettingsProfileRepository } from '../../repositories/settings-profile.repository.js';
import { ModuleEnablementRepository } from '../../repositories/module-enablement.repository.js';
import { LifecycleEventRepository } from '../../repositories/lifecycle-event.repository.js';
import { TemplateSourceRepository } from '../../repositories/template-source.repository.js';
import { HealthSnapshotRepository } from '../../repositories/health-snapshot.repository.js';
import { BotProfileExportRepository } from '../../repositories/export.repository.js';
import { BotProfileImportRepository } from '../../repositories/import.repository.js';

interface Identified {
  id: string;
}

interface FakeDelegate<T extends Identified> {
  findUnique: (args: Record<string, unknown>) => Promise<T | null>;
  findMany: (args: Record<string, unknown>) => Promise<T[]>;
  create: (args: Record<string, unknown>) => Promise<T>;
  update: (args: Record<string, unknown>) => Promise<T>;
  records: T[];
}

const auditLogger: IAuditLogger = { log: async () => {} };

function makeDelegate<T extends Identified>(records: T[] = []): FakeDelegate<T> {
  return {
    records,
    findUnique: async (args) => records.find((item) => matches(item, whereOf(args))) ?? null,
    findMany: async (args) => records.filter((item) => matches(item, whereOf(args))),
    create: async (args) => {
      const item = asRecord(args['data']) as T;
      records.push(item);
      return item;
    },
    update: async (args) => {
      const where = whereOf(args);
      const index = records.findIndex((item) => matches(item, where));
      const updated = { ...records[index], ...asRecord(args['data']) } as T;
      records[index] = updated;
      return updated;
    },
  };
}

function whereOf(args: Record<string, unknown>): Record<string, unknown> {
  return asRecord(args['where']);
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function matches<T extends Identified>(item: T, where: Record<string, unknown>): boolean {
  const record = item as unknown as Record<string, unknown>;
  return Object.entries(where).every(([key, value]) => record[key] === value);
}

describe('bot-management repositories', () => {
  it('upserts and reads a settings profile by bot id', async () => {
    const delegate = makeDelegate([{ id: 'settings-1', botId: 'bot-1', locale: 'ar-EG' }]);
    const repo = new SettingsProfileRepository(auditLogger, {
      botSettingsProfile: delegate,
    } as never);

    const result = await repo.upsertForBot('bot-1', { timezone: 'Africa/Cairo' });
    const found = await repo.findByBotId('bot-1');

    expect(result.isOk()).toBe(true);
    expect(found._unsafeUnwrap().timezone).toBe('Africa/Cairo');
  });

  it('records blocked module enablement states by bot id', async () => {
    const repo = new ModuleEnablementRepository(auditLogger, {
      botModuleEnablement: makeDelegate(),
    } as never);

    const result = await repo.setState({
      botId: 'bot-1',
      moduleName: 'template-management',
      state: BotModuleEnablementState.BLOCKED,
      blockedReason: 'bot-management.blocked.missing_dependency',
    });

    const list = await repo.listByBotId('bot-1');
    expect(result.isOk()).toBe(true);
    expect(list._unsafeUnwrap()[0]?.state).toBe(BotModuleEnablementState.BLOCKED);
  });

  it('appends lifecycle events without replacing history', async () => {
    const repo = new LifecycleEventRepository(auditLogger, {
      botLifecycleEvent: makeDelegate(),
    } as never);

    await repo.append({
      botId: 'bot-1',
      fromStatus: BotLifecycleStatus.DRAFT,
      toStatus: BotLifecycleStatus.CONFIGURED,
      actorId: 'admin-1',
      reason: null,
    });
    await repo.append({
      botId: 'bot-1',
      fromStatus: BotLifecycleStatus.CONFIGURED,
      toStatus: BotLifecycleStatus.ACTIVE,
      actorId: 'admin-1',
      reason: null,
    });

    const history = await repo.listByBotId('bot-1');
    expect(history._unsafeUnwrap()).toHaveLength(2);
  });

  it('stores template source attribution and latest health snapshots', async () => {
    const templateRepo = new TemplateSourceRepository(auditLogger, {
      botTemplateSource: makeDelegate(),
    } as never);
    const healthRepo = new HealthSnapshotRepository(auditLogger, {
      botHealthSnapshot: makeDelegate(),
    } as never);

    await templateRepo.createForBot({
      botId: 'bot-1',
      templateId: 'template-1',
      templateVersionId: 'version-1',
      templateNameSnapshot: 'Support Template',
      provisionedBy: 'admin-1',
    });
    await healthRepo.record({
      botId: 'bot-1',
      status: BotHealthStatus.DEGRADED,
      summaryKey: 'bot-management.health.degraded',
      details: { reason: 'timeout' },
    });

    expect((await templateRepo.findByBotId('bot-1'))._unsafeUnwrap().templateId).toBe('template-1');
    expect((await healthRepo.latestForBot('bot-1'))._unsafeUnwrap().status).toBe(
      BotHealthStatus.DEGRADED,
    );
  });

  it('tracks import and export request completion', async () => {
    const exportRepo = new BotProfileExportRepository(auditLogger, {
      botProfileExport: makeDelegate(),
    } as never);
    const importRepo = new BotProfileImportRepository(auditLogger, {
      botProfileImport: makeDelegate(),
    } as never);

    const exportRequest = await exportRepo.createRequest('bot-1', 'admin-1', 'JSON');
    const importRequest = await importRepo.createRequest('admin-1', 'artifact-1');
    const completedExport = await exportRepo.complete(
      exportRequest._unsafeUnwrap().id,
      'artifact-2',
    );
    const completedImport = await importRepo.complete(
      importRequest._unsafeUnwrap().id,
      'bot-2',
      [],
    );

    expect(completedExport._unsafeUnwrap().status).toBe('COMPLETED');
    expect(completedImport._unsafeUnwrap().createdBotId).toBe('bot-2');
  });
});
