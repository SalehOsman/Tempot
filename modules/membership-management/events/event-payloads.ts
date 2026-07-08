export interface MembershipRequestSubmittedPayload {
  requestId: string;
  telegramId: string;
}

export interface MembershipRequestApprovedPayload {
  requestId: string;
  telegramId: string;
  telegramUsername: string | null;
  telegramLanguageCode: string | null;
  reviewerUserId: string;
}

export interface MembershipRequestRejectedPayload {
  requestId: string;
  telegramId: string;
  reviewerUserId: string;
}

export interface MembershipRequestCancelledPayload {
  requestId: string;
  telegramId: string;
}

export interface MembershipRequestExpiredPayload {
  requestId: string;
  telegramId: string;
}
