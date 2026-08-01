import { type Result } from 'neverthrow';
import { AppError } from '@tempot/shared';

export interface RetrieveOptions {
  query: string;
  userRole: string;
  userId: string;
  confidenceThreshold?: number;
}

export interface RAGContext {
  hasResults: boolean;
  context: string;
  sources: Array<{
    contentId: string;
    contentType: string;
    score: number;
    metadata: unknown;
  }>;
}

export type HelpRagResult = Result<RAGContext, AppError>;
