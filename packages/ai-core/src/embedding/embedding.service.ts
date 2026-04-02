import { embed } from 'ai';
import { cosineDistance, and, inArray, sql } from 'drizzle-orm';
import { ok, err } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import { DrizzleVectorRepository } from '@tempot/database';
import { embeddings } from '@tempot/database';
import type {
  AIConfig,
  EmbeddingInput,
  EmbeddingSearchOptions,
  EmbeddingSearchResult,
} from '../ai-core.types.js';
import type { ResilienceService } from '../resilience/resilience.service.js';
import { AI_ERRORS } from '../ai-core.errors.js';

/** Dependencies for EmbeddingService (max-params = 3) */
export interface EmbeddingServiceDeps {
  config: AIConfig;
  resilience: ResilienceService;
  registry: unknown; // Provider registry from AIProviderFactory
}

export class EmbeddingService extends DrizzleVectorRepository {
  private readonly config: AIConfig;
  private readonly resilience: ResilienceService;
  private readonly registry: unknown;

  constructor(
    db: ConstructorParameters<typeof DrizzleVectorRepository>[0],
    deps: EmbeddingServiceDeps,
  ) {
    super(db);
    this.config = deps.config;
    this.resilience = deps.resilience;
    this.registry = deps.registry;
  }

  /** Embed content and store in vector database */
  async embedAndStore(input: EmbeddingInput): AsyncResult<string, AppError> {
    // Format content with task prefix for documents
    const formattedContent = this.formatForDocument(input);

    // Generate embedding with resilience
    const embeddingResult = await this.resilience.executeEmbedding(async () => {
      const { embedding } = await embed({
        model: (
          this.registry as Record<string, unknown> & { languageModel: (id: string) => unknown }
        ).languageModel(`google:${this.config.embeddingModel}`),
        value: formattedContent,
      });
      return embedding;
    });

    if (embeddingResult.isErr()) {
      return err(new AppError(AI_ERRORS.EMBEDDING_FAILED, embeddingResult.error));
    }

    // Store via parent class create method
    const createResult = await this.create({
      contentId: input.contentId,
      contentType: input.contentType,
      vector: embeddingResult.value,
      metadata: input.metadata ?? null,
    });

    if (createResult.isErr()) return err(createResult.error);
    return ok(createResult.value.id);
  }

  /** Search embeddings with content-type filtering and confidence threshold */
  async searchSimilar(
    options: EmbeddingSearchOptions,
  ): AsyncResult<EmbeddingSearchResult[], AppError> {
    // Format query with task prefix
    const formattedQuery = this.formatForQuery(options.query);
    const threshold = options.confidenceThreshold ?? this.config.confidenceThreshold;
    const limit = options.limit ?? 5;

    // Generate query embedding with resilience
    const embeddingResult = await this.resilience.executeEmbedding(async () => {
      const { embedding } = await embed({
        model: (
          this.registry as Record<string, unknown> & { languageModel: (id: string) => unknown }
        ).languageModel(`google:${this.config.embeddingModel}`),
        value: formattedQuery,
      });
      return embedding;
    });

    if (embeddingResult.isErr()) {
      return err(new AppError(AI_ERRORS.RAG_SEARCH_FAILED, embeddingResult.error));
    }

    // Query with contentType filter and cosine distance
    try {
      const similarity = sql<number>`1 - ${cosineDistance(embeddings.vector, embeddingResult.value)}`;
      const results = await this.db
        .select({
          contentId: embeddings.contentId,
          contentType: embeddings.contentType,
          score: similarity,
          metadata: embeddings.metadata,
        })
        .from(embeddings)
        .where(
          and(
            inArray(embeddings.contentType, options.contentTypes),
            sql`${similarity} >= ${threshold}`,
          ),
        )
        .orderBy(sql`${similarity} DESC`)
        .limit(limit);

      return ok(results as EmbeddingSearchResult[]);
    } catch (error: unknown) {
      return err(new AppError(AI_ERRORS.RAG_SEARCH_FAILED, error));
    }
  }

  /** Delete embeddings by contentId */
  async deleteByContentId(contentId: string): AsyncResult<void, AppError> {
    try {
      await this.db.delete(embeddings).where(sql`${embeddings.contentId} = ${contentId}`);
      return ok(undefined);
    } catch (error: unknown) {
      return err(new AppError(AI_ERRORS.EMBEDDING_FAILED, error));
    }
  }

  /** Format content with document task prefix (D11) */
  private formatForDocument(input: EmbeddingInput): string {
    const title = (input.metadata?.title as string) ?? input.contentId;
    const content = typeof input.content === 'string' ? input.content : '';
    return `title: ${title} | text: ${content}`;
  }

  /** Format query with search task prefix (D11) */
  private formatForQuery(query: string | Buffer): string {
    const text = typeof query === 'string' ? query : '';
    return `task: search result | query: ${text}`;
  }
}
