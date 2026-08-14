export type MembershipRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';

export interface SubmitMembershipRequestInput {
  telegramId: string;
  fullName?: string;
  nickname?: string;
  mobileNumber?: string;
  telegramUsername?: string;
  telegramFirstName?: string;
  telegramLastName?: string;
  telegramLanguageCode?: string;
  requestMessage?: string;
}

export interface MembershipRequest {
  id: string;
  telegramId: string;
  fullName?: string | null;
  nickname?: string | null;
  mobileNumber?: string | null;
  telegramUsername: string | null;
  telegramFirstName: string | null;
  telegramLastName: string | null;
  telegramLanguageCode: string | null;
  requestMessage?: string | null;
  status: MembershipRequestStatus;
  requestedAt: Date;
  reviewedAt: Date | null;
  reviewerUserId: string | null;
  rejectionReason: string | null;
  createdUserProfileId: string | null;
}
