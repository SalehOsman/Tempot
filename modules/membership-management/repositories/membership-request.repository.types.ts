import type { AsyncResult } from '@tempot/shared';
import type { AppError } from '@tempot/shared';
import type {
  MembershipRequest,
  SubmitMembershipRequestInput,
} from '../types/membership-request.types.js';

export interface ApproveMembershipRequestInput {
  requestId: string;
  reviewerUserId: string;
}

export interface RejectMembershipRequestInput {
  requestId: string;
  reviewerUserId: string;
  rejectionReason: string;
}

export interface ResolveMembershipRequestInput {
  requestId: string;
}

export interface ListPendingMembershipRequestsInput {
  limit: number;
}

export interface MembershipRequestRepository {
  findActiveByTelegramId(telegramId: string): AsyncResult<MembershipRequest | null, AppError>;
  findRequestById(requestId: string): AsyncResult<MembershipRequest, AppError>;
  listPending(
    input: ListPendingMembershipRequestsInput,
  ): AsyncResult<MembershipRequest[], AppError>;
  createRequest(input: SubmitMembershipRequestInput): AsyncResult<MembershipRequest, AppError>;
  updatePendingDetails(
    requestId: string,
    input: SubmitMembershipRequestInput,
  ): AsyncResult<MembershipRequest, AppError>;
  markApproved(input: ApproveMembershipRequestInput): AsyncResult<MembershipRequest, AppError>;
  markRejected(input: RejectMembershipRequestInput): AsyncResult<MembershipRequest, AppError>;
  markCancelled(input: ResolveMembershipRequestInput): AsyncResult<MembershipRequest, AppError>;
  markExpired(input: ResolveMembershipRequestInput): AsyncResult<MembershipRequest, AppError>;
}
