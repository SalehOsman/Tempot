import { randomUUID } from 'node:crypto';
import {
  BaseRepository,
  type DatabaseClient,
  type IAuditLogger,
  type Prisma,
} from '@tempot/database';
import { AppError, err, ok, type AsyncResult } from '@tempot/shared';
import type {
  MembershipRequest,
  SubmitMembershipRequestInput,
} from '../types/membership-request.types.js';
import {
  mapRecord,
  parseTelegramId,
  type MembershipRequestRecord,
} from './membership-request.mapper.js';
import type {
  ApproveMembershipRequestInput,
  ListPendingMembershipRequestsInput,
  MembershipRequestRepository,
  RejectMembershipRequestInput,
  ResolveMembershipRequestInput,
} from './membership-request.repository.types.js';

export class PrismaMembershipRequestRepository
  extends BaseRepository<MembershipRequestRecord>
  implements MembershipRequestRepository
{
  protected moduleName = 'membership-management';
  protected entityName = 'membershipRequest';

  protected get model() {
    return this.db.membershipRequest;
  }

  constructor(auditLogger: IAuditLogger, db?: DatabaseClient) {
    super(auditLogger, db);
  }

  override withTransaction(tx: Prisma.TransactionClient): this {
    return new PrismaMembershipRequestRepository(this.auditLogger, tx) as this;
  }

  async findActiveByTelegramId(
    telegramId: string,
  ): AsyncResult<MembershipRequest | null, AppError> {
    const parsed = parseTelegramId(telegramId);
    if (parsed.isErr()) return err(parsed.error);

    const result = await super.findMany({
      where: {
        telegramId: parsed.value,
        status: 'PENDING',
      },
      take: 1,
      orderBy: { requestedAt: 'desc' },
    });
    if (result.isErr()) return err(result.error);

    const request = result.value[0];
    return ok(request === undefined ? null : mapRecord(request));
  }

  async findRequestById(requestId: string): AsyncResult<MembershipRequest, AppError> {
    const result = await super.findById(requestId);
    if (result.isErr()) return err(result.error);

    return ok(mapRecord(result.value));
  }

  async listPending(
    input: ListPendingMembershipRequestsInput,
  ): AsyncResult<MembershipRequest[], AppError> {
    const result = await super.findMany({
      where: { status: 'PENDING' },
      take: input.limit,
      orderBy: { requestedAt: 'asc' },
    });
    if (result.isErr()) return err(result.error);

    return ok(result.value.map(mapRecord));
  }

  async createRequest(
    input: SubmitMembershipRequestInput,
  ): AsyncResult<MembershipRequest, AppError> {
    const parsed = parseTelegramId(input.telegramId);
    if (parsed.isErr()) return err(parsed.error);

    const result = await super.create({
      id: randomUUID(),
      telegramId: parsed.value,
      telegramUsername: input.telegramUsername ?? null,
      telegramFirstName: input.telegramFirstName ?? null,
      telegramLastName: input.telegramLastName ?? null,
      telegramLanguageCode: input.telegramLanguageCode ?? null,
      status: 'PENDING',
    });
    if (result.isErr()) return err(result.error);

    return ok(mapRecord(result.value));
  }

  async markApproved(
    input: ApproveMembershipRequestInput,
  ): AsyncResult<MembershipRequest, AppError> {
    return this.markPendingTerminal(input.requestId, {
      status: 'APPROVED',
      reviewerUserId: input.reviewerUserId,
      reviewedAt: new Date(),
    });
  }

  async markRejected(
    input: RejectMembershipRequestInput,
  ): AsyncResult<MembershipRequest, AppError> {
    return this.markPendingTerminal(input.requestId, {
      status: 'REJECTED',
      reviewerUserId: input.reviewerUserId,
      rejectionReason: input.rejectionReason,
      reviewedAt: new Date(),
    });
  }

  async markCancelled(
    input: ResolveMembershipRequestInput,
  ): AsyncResult<MembershipRequest, AppError> {
    return this.markPendingTerminal(input.requestId, {
      status: 'CANCELLED',
      reviewedAt: new Date(),
    });
  }

  async markExpired(
    input: ResolveMembershipRequestInput,
  ): AsyncResult<MembershipRequest, AppError> {
    return this.markPendingTerminal(input.requestId, {
      status: 'EXPIRED',
      reviewedAt: new Date(),
    });
  }

  private async markPendingTerminal(
    requestId: string,
    data: Prisma.MembershipRequestUpdateManyMutationInput,
  ): AsyncResult<MembershipRequest, AppError> {
    const { userId } = this.getContext();
    try {
      const before = await this.findRequestById(requestId);
      if (before.isErr()) return err(before.error);
      if (before.value.status !== 'PENDING') {
        return err(
          new AppError('membership-management.request_already_terminal', {
            requestId,
            status: before.value.status,
          }),
        );
      }

      const result = await this.db.membershipRequest.updateMany({
        where: {
          id: requestId,
          status: 'PENDING',
          isDeleted: false,
        },
        data: {
          ...data,
          updatedBy: userId,
        },
      });

      if (result.count === 0) {
        const existing = await this.findRequestById(requestId);
        if (existing.isErr()) return err(existing.error);

        return err(
          new AppError('membership-management.request_already_terminal', {
            requestId,
            status: existing.value.status,
          }),
        );
      }

      const after = await this.findRequestById(requestId);
      if (after.isErr()) return err(after.error);

      await this.logTransitionAudit(before.value, after.value);

      return ok(after.value);
    } catch (error) {
      return err(new AppError('membership-management.update_failed', error));
    }
  }

  private async logTransitionAudit(
    before: MembershipRequest,
    after: MembershipRequest,
  ): Promise<void> {
    const { userId, userRole } = this.getContext();
    await this.auditLogger.log({
      userId,
      userRole,
      action: 'membership-management.membershipRequest.transition',
      module: 'membership-management',
      targetId: after.id,
      targetTelegramId: after.telegramId,
      before: {
        status: before.status,
        reviewerUserId: before.reviewerUserId,
      },
      after: {
        status: after.status,
        reviewerUserId: after.reviewerUserId,
        reviewedAt: after.reviewedAt?.toISOString() ?? null,
        createdUserProfileId: after.createdUserProfileId,
      },
      status: 'SUCCESS',
    });
  }
}
