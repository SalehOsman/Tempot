import { AppError, err, ok, type Result } from '@tempot/shared';
import type {
  MembershipRequest,
  MembershipRequestStatus,
} from '../types/membership-request.types.js';

export interface MembershipRequestRecord {
  id: string;
  telegramId: bigint;
  fullName?: string | null;
  nickname?: string | null;
  mobileNumber?: string | null;
  telegramUsername: string | null;
  telegramFirstName: string | null;
  telegramLastName: string | null;
  telegramLanguageCode: string | null;
  requestMessage?: string | null;
  status: string;
  requestedAt: Date;
  reviewedAt: Date | null;
  reviewerUserId: string | null;
  rejectionReason: string | null;
  createdUserProfileId: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
  isDeleted: boolean;
  deletedAt: Date | null;
  deletedBy: string | null;
}

export function parseTelegramId(telegramId: string): Result<bigint, AppError> {
  if (!/^[1-9]\d*$/u.test(telegramId)) {
    return err(new AppError('membership-management.invalid_telegram_id', { telegramId }));
  }

  return ok(BigInt(telegramId));
}

export function mapRecord(record: MembershipRequestRecord): MembershipRequest {
  return {
    id: record.id,
    telegramId: record.telegramId.toString(),
    fullName: record.fullName ?? null,
    nickname: record.nickname ?? null,
    mobileNumber: record.mobileNumber ?? null,
    telegramUsername: record.telegramUsername,
    telegramFirstName: record.telegramFirstName,
    telegramLastName: record.telegramLastName,
    telegramLanguageCode: record.telegramLanguageCode,
    requestMessage: record.requestMessage ?? null,
    status: mapStatus(record.status),
    requestedAt: record.requestedAt,
    reviewedAt: record.reviewedAt,
    reviewerUserId: record.reviewerUserId,
    rejectionReason: record.rejectionReason,
    createdUserProfileId: record.createdUserProfileId,
  };
}

function mapStatus(status: string): MembershipRequestStatus {
  if (
    status === 'PENDING' ||
    status === 'APPROVED' ||
    status === 'REJECTED' ||
    status === 'CANCELLED' ||
    status === 'EXPIRED'
  ) {
    return status;
  }

  return 'PENDING';
}
