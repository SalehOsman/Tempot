import type { InteractionEvent } from '@prisma/client';
import { AppError, type Result } from '@tempot/shared';
import { err, ok } from 'neverthrow';
import { prisma, type Prisma } from '../prisma/prisma.client.js';

interface InteractionEventDelegate {
  create(args: { data: Prisma.InteractionEventUncheckedCreateInput }): Promise<InteractionEvent>;
  findMany(args: Prisma.InteractionEventFindManyArgs): Promise<InteractionEvent[]>;
}

interface InteractionEventDatabaseClient {
  interactionEvent: InteractionEventDelegate;
}

export class InteractionEventRepository {
  constructor(private readonly db: InteractionEventDatabaseClient = prisma) {}

  async create(data: Record<string, unknown>): Promise<Result<InteractionEvent, AppError>> {
    try {
      const item = await this.db.interactionEvent.create({
        data: {
          traceId: stringValue(data['traceId'], 'unknown'),
          sequence: numberValue(data['sequence'], 0),
          updateId: optionalNumber(data['updateId']),
          updateType: stringValue(data['updateType'], 'message'),
          command: optionalString(data['command']),
          callbackData: optionalString(data['callbackData']),
          callbackNamespace: optionalString(data['callbackNamespace']),
          module: stringValue(data['module'], 'unknown'),
          userId: optionalString(data['userId']),
          chatId: optionalString(data['chatId']),
          stage: stringValue(data['stage'], 'received'),
          status: stringValue(data['status'], 'received'),
          action: optionalString(data['action']),
          viewKey: optionalString(data['viewKey']),
          responseType: optionalString(data['responseType']),
          reason: optionalString(data['reason']),
          errorCode: optionalString(data['errorCode']),
          referenceCode: optionalString(data['referenceCode']),
          metadata: jsonValue(data['metadata']),
          occurredAt: dateValue(data['occurredAt']),
        },
      });
      return ok(item);
    } catch (error: unknown) {
      return err(new AppError('database.interaction_event_create_failed', { error }));
    }
  }

  async findMany(
    args: Prisma.InteractionEventFindManyArgs,
  ): Promise<Result<InteractionEvent[], AppError>> {
    try {
      const items = await this.db.interactionEvent.findMany(args);
      return ok(items);
    } catch (error: unknown) {
      return err(new AppError('database.interaction_event_find_many_failed', { error }));
    }
  }
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function stringValue(value: unknown, fallback: string): string {
  return optionalString(value) ?? fallback;
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function numberValue(value: unknown, fallback: number): number {
  return optionalNumber(value) ?? fallback;
}

function dateValue(value: unknown): Date | undefined {
  return value instanceof Date ? value : undefined;
}

function jsonValue(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  return value as Prisma.InputJsonValue;
}
