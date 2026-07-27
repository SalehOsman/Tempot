import { describe, expect, it } from 'vitest';
import { err, ok } from 'neverthrow';
import { AppError } from '@tempot/shared';
import {
  BACKUP_QUEUE_NAME,
  BackupQueue,
  createBackupQueue,
  type QueueLike,
} from '../../src/index.js';

describe('createBackupQueue', () => {
  it('should create a backup queue through the injected queue factory', () => {
    const queue: QueueLike = {
      add: async () => undefined,
    };
    const names: string[] = [];

    const result = createBackupQueue({
      queueFactory: (name) => {
        names.push(name);
        return ok(queue);
      },
    });

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBeInstanceOf(BackupQueue);
    expect(names).toEqual([BACKUP_QUEUE_NAME]);
  });

  it('should return the queue factory error when queue creation fails', () => {
    const result = createBackupQueue({
      queueFactory: () => err(new AppError('shared.queue_factory_failed')),
    });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('shared.queue_factory_failed');
  });
});
