export type MembershipRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';

export interface SubmitMembershipRequestInput {
  telegramId: string;
  telegramUsername?: string;
  telegramFirstName?: string;
  telegramLastName?: string;
  telegramLanguageCode?: string;
}

export interface MembershipRequest {
  id: string;
  telegramId: string;
  telegramUsername: string | null;
  telegramFirstName: string | null;
  telegramLastName: string | null;
  telegramLanguageCode: string | null;
  status: MembershipRequestStatus;
  requestedAt: Date;
  reviewedAt: Date | null;
  reviewerUserId: string | null;
  rejectionReason: string | null;
  createdUserProfileId: string | null;
}
