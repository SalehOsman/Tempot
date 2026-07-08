import type { Result } from '@tempot/shared';
import type { AppError } from '@tempot/shared';
import type {
  MembershipApprovalProfileInput,
  MembershipApprovalProfileResult,
} from '../services/membership-approval-profile.service.js';
import type { ModuleLogger } from '../types/module-deps.types.js';

export interface MembershipApprovalProfileServicePort {
  ensureProfileFromApproval(
    input: MembershipApprovalProfileInput,
  ): Promise<Result<MembershipApprovalProfileResult, AppError>>;
}

export function createMembershipApprovalHandler(
  service: MembershipApprovalProfileServicePort,
  logger: ModuleLogger,
): (payload: unknown) => Promise<void> {
  return async (payload: unknown): Promise<void> => {
    const parsed = parsePayload(payload);
    if (parsed === null) {
      logger.warn({ msg: 'membership_approval_payload_invalid' });
      return;
    }

    const result = await service.ensureProfileFromApproval(parsed);
    if (result.isErr()) {
      logger.error({
        msg: 'membership_approval_profile_activation_failed',
        requestId: parsed.requestId,
        errorCode: result.error.code,
      });
      return;
    }

    logger.info({
      msg: 'membership_approval_profile_activation_completed',
      requestId: parsed.requestId,
      userId: result.value.user.id,
      created: result.value.created,
    });
  };
}

function parsePayload(payload: unknown): MembershipApprovalProfileInput | null {
  if (payload === null || typeof payload !== 'object') return null;
  const candidate = payload as Record<string, unknown>;
  const requestId = candidate['requestId'];
  const telegramId = candidate['telegramId'];
  const reviewerUserId = candidate['reviewerUserId'];
  if (
    typeof requestId !== 'string' ||
    typeof telegramId !== 'string' ||
    typeof reviewerUserId !== 'string'
  ) {
    return null;
  }

  return {
    requestId,
    telegramId,
    telegramUsername: optionalString(candidate['telegramUsername']),
    telegramLanguageCode: optionalString(candidate['telegramLanguageCode']),
    reviewerUserId,
  };
}

function optionalString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}
