import type { AsyncResult } from '@tempot/shared';
import { AppError, err } from '@tempot/shared';
import type { MembershipEventBus } from '../types/module-deps.types.js';
import type {
  MembershipRequest,
  SubmitMembershipRequestInput,
} from '../types/membership-request.types.js';
import type {
  ApproveMembershipRequestInput,
  ListPendingMembershipRequestsInput,
  MembershipRequestRepository,
  RejectMembershipRequestInput,
  ResolveMembershipRequestInput,
} from '../repositories/membership-request.repository.types.js';
import {
  MEMBERSHIP_REQUEST_APPROVED_EVENT,
  MEMBERSHIP_REQUEST_CANCELLED_EVENT,
  MEMBERSHIP_REQUEST_EXPIRED_EVENT,
  MEMBERSHIP_REQUEST_REJECTED_EVENT,
  MEMBERSHIP_REQUEST_SUBMITTED_EVENT,
} from '../events/event-names.js';

interface MembershipRequestServiceDeps {
  repository: MembershipRequestRepository;
  eventBus: MembershipEventBus;
}

export class MembershipRequestService {
  constructor(private readonly deps: MembershipRequestServiceDeps) {}

  async listPending(
    input: ListPendingMembershipRequestsInput,
  ): AsyncResult<MembershipRequest[], AppError> {
    return this.deps.repository.listPending(input);
  }

  async getById(requestId: string): AsyncResult<MembershipRequest, AppError> {
    return this.deps.repository.findRequestById(requestId);
  }

  async submit(input: SubmitMembershipRequestInput): AsyncResult<MembershipRequest, AppError> {
    const existing = await this.deps.repository.findActiveByTelegramId(input.telegramId);
    if (existing.isErr()) return err(existing.error);
    if (existing.value !== null) {
      return this.deps.repository.updatePendingDetails(existing.value.id, input);
    }

    const created = await this.deps.repository.createRequest(input);
    if (created.isErr()) return err(created.error);

    const published = await this.deps.eventBus.publish(MEMBERSHIP_REQUEST_SUBMITTED_EVENT, {
      requestId: created.value.id,
      telegramId: created.value.telegramId,
    });
    if (published.isErr()) return err(published.error);

    return created;
  }

  async approve(input: ApproveMembershipRequestInput): AsyncResult<MembershipRequest, AppError> {
    const approved = await this.deps.repository.markApproved(input);
    if (approved.isErr()) return err(approved.error);

    const published = await this.deps.eventBus.publish(MEMBERSHIP_REQUEST_APPROVED_EVENT, {
      requestId: approved.value.id,
      telegramId: approved.value.telegramId,
      telegramUsername: approved.value.telegramUsername,
      telegramLanguageCode: approved.value.telegramLanguageCode,
      reviewerUserId: input.reviewerUserId,
    });
    if (published.isErr()) return err(published.error);

    return approved;
  }

  async reject(input: RejectMembershipRequestInput): AsyncResult<MembershipRequest, AppError> {
    const rejected = await this.deps.repository.markRejected(input);
    if (rejected.isErr()) return err(rejected.error);

    const published = await this.deps.eventBus.publish(MEMBERSHIP_REQUEST_REJECTED_EVENT, {
      requestId: rejected.value.id,
      telegramId: rejected.value.telegramId,
      reviewerUserId: input.reviewerUserId,
    });
    if (published.isErr()) return err(published.error);

    return rejected;
  }

  async cancel(input: ResolveMembershipRequestInput): AsyncResult<MembershipRequest, AppError> {
    const cancelled = await this.deps.repository.markCancelled(input);
    if (cancelled.isErr()) return err(cancelled.error);

    const published = await this.deps.eventBus.publish(MEMBERSHIP_REQUEST_CANCELLED_EVENT, {
      requestId: cancelled.value.id,
      telegramId: cancelled.value.telegramId,
    });
    if (published.isErr()) return err(published.error);

    return cancelled;
  }

  async expire(input: ResolveMembershipRequestInput): AsyncResult<MembershipRequest, AppError> {
    const expired = await this.deps.repository.markExpired(input);
    if (expired.isErr()) return err(expired.error);

    const published = await this.deps.eventBus.publish(MEMBERSHIP_REQUEST_EXPIRED_EVENT, {
      requestId: expired.value.id,
      telegramId: expired.value.telegramId,
    });
    if (published.isErr()) return err(published.error);

    return expired;
  }
}
