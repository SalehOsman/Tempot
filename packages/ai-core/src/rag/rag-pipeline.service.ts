import { ok, err } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import type { AIContentType, EmbeddingSearchResult } from '../ai-core.types.js';
import type { EmbeddingService } from '../embedding/embedding.service.js';
import { AI_ERRORS } from '../ai-core.errors.js';

/** RAG context result */
export interface RAGContext {
  hasResults: boolean;
  context: string;
  sources: EmbeddingSearchResult[];
}

/** Options for the retrieve method (Rule: max-params=3) */
export interface RetrieveOptions {
  query: string;
  userRole: string;
  userId: string;
  confidenceThreshold?: number;
}

/** Content type access control matrix (D5) */
const CONTENT_TYPE_ACCESS: Record<AIContentType, string[]> = {
  'ui-guide': ['user', 'admin', 'super_admin'],
  'bot-functions': ['admin', 'super_admin'],
  'db-schema': ['super_admin'],
  'developer-docs': ['developer', 'super_admin'],
  'custom-knowledge': [], // Checked per-content via metadata.accessRoles
  'user-memory': [], // Checked per-user via metadata.userId
};

export class RAGPipeline {
  constructor(private readonly embeddingService: EmbeddingService) {}

  /** Retrieve relevant context for a query, filtered by user role */
  async retrieve(options: RetrieveOptions): AsyncResult<RAGContext, AppError> {
    const { query, userRole, userId, confidenceThreshold } = options;

    // 1. Determine accessible content types
    const allowedTypes = this.getAccessibleContentTypes(userRole);

    if (allowedTypes.length === 0) {
      return ok({ hasResults: false, context: '', sources: [] });
    }

    // 2. Search embeddings with content type filter
    const searchResult = await this.embeddingService.searchSimilar({
      query,
      contentTypes: allowedTypes,
      limit: 5,
      confidenceThreshold,
    });

    if (searchResult.isErr()) {
      return err(new AppError(AI_ERRORS.RAG_SEARCH_FAILED, searchResult.error));
    }

    const results = searchResult.value;

    // 3. Filter user-memory results to only the requesting user
    const filtered = results.filter((r) => {
      if (r.contentType === 'user-memory') {
        return (r.metadata as Record<string, unknown> | null)?.userId === userId;
      }
      if (r.contentType === 'custom-knowledge') {
        const accessRoles = (r.metadata as Record<string, unknown> | null)?.accessRoles as
          | string[]
          | undefined;
        return accessRoles ? accessRoles.includes(userRole) : false;
      }
      return true;
    });

    if (filtered.length === 0) {
      return ok({ hasResults: false, context: '', sources: [] });
    }

    // 4. Build context string from results
    const context = filtered
      .map((r) => {
        const title = (r.metadata as Record<string, unknown> | null)?.title ?? r.contentId;
        return `[${r.contentType}] ${String(title)}: (score: ${r.score.toFixed(2)})`;
      })
      .join('\n\n');

    return ok({ hasResults: true, context, sources: filtered });
  }

  /** Get content types accessible to a given role */
  private getAccessibleContentTypes(role: string): AIContentType[] {
    const types: AIContentType[] = [];
    for (const [contentType, roles] of Object.entries(CONTENT_TYPE_ACCESS)) {
      if (roles.includes(role)) {
        types.push(contentType as AIContentType);
      }
    }
    // user-memory is always accessible (filtered by userId in results)
    if (!types.includes('user-memory')) {
      types.push('user-memory');
    }
    // custom-knowledge is always queried (filtered by accessRoles in results)
    if (!types.includes('custom-knowledge')) {
      types.push('custom-knowledge');
    }
    return types;
  }
}
