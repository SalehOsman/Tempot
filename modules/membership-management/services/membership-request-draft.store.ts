export type MembershipRequestDraftStep =
  | 'fullName'
  | 'nickname'
  | 'mobileNumber'
  | 'requestMessage';

export interface MembershipRequestDraft {
  step: MembershipRequestDraftStep;
  telegramId: string;
  telegramUsername?: string;
  telegramFirstName?: string;
  telegramLastName?: string;
  telegramLanguageCode?: string;
  fullName?: string;
  nickname?: string;
  mobileNumber?: string;
}

export class MembershipRequestDraftStore {
  private readonly drafts = new Map<string, MembershipRequestDraft>();

  start(draft: Omit<MembershipRequestDraft, 'step'>): void {
    this.drafts.set(draft.telegramId, { ...draft, step: 'fullName' });
  }

  get(telegramId: string): MembershipRequestDraft | null {
    return this.drafts.get(telegramId) ?? null;
  }

  save(draft: MembershipRequestDraft): void {
    this.drafts.set(draft.telegramId, draft);
  }

  clear(telegramId: string): void {
    this.drafts.delete(telegramId);
  }
}
