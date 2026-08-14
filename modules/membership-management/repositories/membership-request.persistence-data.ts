import type { Prisma } from '@tempot/database';
import type { SubmitMembershipRequestInput } from '../types/membership-request.types.js';

export function requestDetailsUpdateData(
  input: SubmitMembershipRequestInput,
): Prisma.MembershipRequestUpdateManyMutationInput {
  return {
    fullName: input.fullName,
    nickname: input.nickname,
    mobileNumber: input.mobileNumber,
    telegramUsername: input.telegramUsername,
    telegramFirstName: input.telegramFirstName,
    telegramLastName: input.telegramLastName,
    telegramLanguageCode: input.telegramLanguageCode,
    requestMessage: input.requestMessage,
  };
}
