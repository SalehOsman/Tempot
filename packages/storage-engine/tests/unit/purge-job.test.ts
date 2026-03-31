import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ok, err } from 'neverthrow';
import { AppError, queueFactory } from '@tempot/shared';
import { processPurge, createPurgeQueue } from '../../src/jobs/purge.job.js';
import { STORAGE_ERRORS } from '../../src/storage.errors.js';
import type { Attachment } from '../../src/storage.types.js';

// Mock queueFactory from @tempot/shared
vi.mock('@tempot/shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tempot/shared')>();
  return {
    ...actual,
    queueFactory: vi.fn().mockReturnValue(ok({ name: 'storage-purge' })),
  };
});

const makeAttachment = (overrides: Partial<Attachment> = {}): Attachment => ({
  id: 'att-1',
  fileName: 'uuid.pdf',
  originalName: 'test.pdf',
  mimeType: 'application/pdf',
  size: 1024,
  provider: 'local',
  providerKey: 'general/2025-12/uuid.pdf',
  url: null,
  metadata: null,
  moduleId: null,
  entityId: null,
  isEncrypted: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: null,
  updatedBy: null,
  isDeleted: true,
  deletedAt: new Date('2025-12-01'),
  deletedBy: null,
  ...overrides,
});

function createMockDeps() {
  return {
    attachmentRepo: {
      findExpiredDeleted: vi.fn(),
      hardDelete: vi.fn().mockResolvedValue(ok(undefined)),
    },
    provider: {
      type: 'local' as const,
      delete: vi.fn().mockResolvedValue(ok(undefined)),
    },
    eventBus: {
      publish: vi.fn().mockResolvedValue(ok(undefined)),
    },
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    },
    retentionDays: 30,
  };
}

describe('PurgeJob - processPurge', () => {
  let deps: ReturnType<typeof createMockDeps>;

  beforeEach(() => {
    deps = createMockDeps();
  });

  it('should purge expired records and emit events', async () => {
    const expired = [makeAttachment({ id: 'att-1' }), makeAttachment({ id: 'att-2' })];
    deps.attachmentRepo.findExpiredDeleted.mockResolvedValue(ok(expired));

    const result = await processPurge(deps);

    expect(result.isOk()).toBe(true);
    expect(deps.provider.delete).toHaveBeenCalledTimes(2);
    expect(deps.attachmentRepo.hardDelete).toHaveBeenCalledTimes(2);
    expect(deps.eventBus.publish).toHaveBeenCalledTimes(2);
    expect(deps.eventBus.publish).toHaveBeenCalledWith(
      'storage.file.deleted',
      expect.objectContaining({ attachmentId: 'att-1', permanent: true }),
    );
  });

  it('should handle no expired records gracefully', async () => {
    deps.attachmentRepo.findExpiredDeleted.mockResolvedValue(ok([]));

    const result = await processPurge(deps);

    expect(result.isOk()).toBe(true);
    expect(deps.provider.delete).not.toHaveBeenCalled();
    expect(deps.attachmentRepo.hardDelete).not.toHaveBeenCalled();
  });

  it('should continue processing when provider delete fails for one record', async () => {
    const expired = [
      makeAttachment({ id: 'att-1', providerKey: 'key-1' }),
      makeAttachment({ id: 'att-2', providerKey: 'key-2' }),
    ];
    deps.attachmentRepo.findExpiredDeleted.mockResolvedValue(ok(expired));
    deps.provider.delete
      .mockResolvedValueOnce(err(new AppError(STORAGE_ERRORS.DELETE_FAILED)))
      .mockResolvedValueOnce(ok(undefined));

    const result = await processPurge(deps);

    expect(result.isOk()).toBe(true);
    // Second record should still be processed
    expect(deps.attachmentRepo.hardDelete).toHaveBeenCalledWith(['att-2']);
    expect(deps.logger.warn).toHaveBeenCalled();
  });

  it('should emit storage.file.deleted with permanent: true', async () => {
    const expired = [makeAttachment({ id: 'att-1' })];
    deps.attachmentRepo.findExpiredDeleted.mockResolvedValue(ok(expired));

    await processPurge(deps);

    expect(deps.eventBus.publish).toHaveBeenCalledWith(
      'storage.file.deleted',
      expect.objectContaining({ permanent: true }),
    );
  });

  it('should calculate beforeDate from retentionDays', async () => {
    deps.attachmentRepo.findExpiredDeleted.mockResolvedValue(ok([]));

    await processPurge(deps);

    const calledDate = deps.attachmentRepo.findExpiredDeleted.mock.calls[0][0] as Date;
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() - 30);
    // Within 1 second tolerance
    expect(Math.abs(calledDate.getTime() - expectedDate.getTime())).toBeLessThan(1000);
  });

  it('should return error when findExpiredDeleted fails', async () => {
    deps.attachmentRepo.findExpiredDeleted.mockResolvedValue(
      err(new AppError('storage.find_many_failed')),
    );

    const result = await processPurge(deps);

    expect(result.isErr()).toBe(true);
  });
});

describe('createPurgeQueue', () => {
  it('should create a queue via queueFactory', () => {
    const result = createPurgeQueue();
    expect(result.isOk()).toBe(true);
  });

  it('should pass shutdownManager to queueFactory when provided', () => {
    const mockShutdownManager = { register: vi.fn() };
    const mockedQueueFactory = vi.mocked(queueFactory);
    mockedQueueFactory.mockClear();

    createPurgeQueue(mockShutdownManager as never);

    expect(mockedQueueFactory).toHaveBeenCalledWith('storage-purge', {
      shutdownManager: mockShutdownManager,
    });
  });

  it('should return Result<Queue, AppError> (not Result<unknown, AppError>)', () => {
    const result = createPurgeQueue();
    if (result.isOk()) {
      // The value should have the shape returned by queueFactory (a Queue)
      // We verify it's not typed as unknown by accessing .name
      const queue = result.value;
      expect(queue).toHaveProperty('name', 'storage-purge');
    }
  });
});

describe('PurgeJob - eventBus.publish failure (fire-and-log)', () => {
  let deps: ReturnType<typeof createMockDeps>;

  beforeEach(() => {
    deps = createMockDeps();
  });

  it('should log warning when eventBus.publish fails during purge but still succeed', async () => {
    const expired = [makeAttachment({ id: 'att-1' })];
    deps.attachmentRepo.findExpiredDeleted.mockResolvedValue(ok(expired));
    deps.eventBus.publish.mockResolvedValue(err(new AppError('event_bus.publish_failed')));

    const result = await processPurge(deps);

    // Purge should still succeed even though event publishing failed
    expect(result.isOk()).toBe(true);
    // The record should still be hard-deleted
    expect(deps.attachmentRepo.hardDelete).toHaveBeenCalledWith(['att-1']);
    // Logger should have warned about the event publish failure
    expect(deps.logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        code: STORAGE_ERRORS.EVENT_PUBLISH_FAILED,
        event: 'storage.file.deleted',
        attachmentId: 'att-1',
      }),
    );
  });
});
