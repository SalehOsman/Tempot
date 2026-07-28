import type { UserRole } from '@tempot/module-registry';

export type HelpAssistantState = 'answered' | 'no-context' | 'degraded';

export interface HelpAssistantCitation {
  blockId: string;
  sourceId?: string;
}

export interface HelpAssistantAnswer {
  state: HelpAssistantState;
  answer: string;
  citations: readonly HelpAssistantCitation[];
  confidence: number;
}

export interface HelpAssistantQuestion {
  question: string;
  userId: string;
  chatId: string;
  role: UserRole;
  locale: string;
}

export type HelpAssistantResult =
  | { success: true; value: HelpAssistantAnswer }
  | { success: false; error: { code: string } };

export interface HelpAssistantProvider {
  ask(input: HelpAssistantQuestion): Promise<HelpAssistantResult>;
}
