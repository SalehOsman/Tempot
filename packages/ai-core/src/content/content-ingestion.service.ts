import { ok, err } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import type {
  EmbeddingInput,
  AIContentType,
  ChunkingConfig,
  ContentChunk,
} from '../ai-core.types.js';
import type { EmbeddingService } from '../embedding/embedding.service.js';
import type { AILogger, AIEventBus } from '../ai-core.contracts.js';
import { AI_ERRORS } from '../ai-core.errors.js';

/** Dependencies for ContentIngestionService (max-params = 3) */
export interface ContentIngestionDeps {
  chunkingConfig: ChunkingConfig;
  logger: AILogger;
  eventBus: AIEventBus;
}

/** Options for the ingest method (max-params = 3) */
export interface IngestOptions {
  contentId: string;
  contentType: AIContentType;
  content: string;
  metadata?: Record<string, unknown>;
  source?: 'auto' | 'manual';
}

export class ContentIngestionService {
  private readonly chunkingConfig: ChunkingConfig;
  private readonly logger: AILogger;
  private readonly eventBus: AIEventBus;

  constructor(
    private readonly embeddingService: EmbeddingService,
    deps: ContentIngestionDeps,
  ) {
    this.chunkingConfig = deps.chunkingConfig;
    this.logger = deps.logger;
    this.eventBus = deps.eventBus;
  }

  /** Ingest content: validate → sanitize → chunk → embed → store */
  async ingest(options: IngestOptions): AsyncResult<number, AppError> {
    const { contentId, contentType, content, metadata, source = 'auto' } = options;

    // 1. Validate size
    const sizeBytes = Buffer.byteLength(content, 'utf8');
    if (sizeBytes > this.chunkingConfig.maxDocumentBytes) {
      return err(
        new AppError(AI_ERRORS.CONTENT_SIZE_EXCEEDED, {
          sizeBytes,
          maxBytes: this.chunkingConfig.maxDocumentBytes,
        }),
      );
    }

    // 2. Sanitize PII
    const sanitized = this.sanitizePII(content);

    // 3. Chunk content
    const chunks = this.chunkContent(sanitized, metadata ?? {});

    // 4. Delete existing embeddings for this contentId (re-indexing)
    await this.embeddingService.deleteByContentId(contentId);

    // 5. Embed and store each chunk
    let storedCount = 0;
    for (const chunk of chunks) {
      const input: EmbeddingInput = {
        contentId,
        contentType,
        content: chunk.text,
        metadata: {
          ...chunk.metadata,
          text: chunk.text,
          chunkIndex: chunk.chunkIndex,
          totalChunks: chunk.totalChunks,
        },
      };

      const result = await this.embeddingService.embedAndStore(input);
      if (result.isErr()) {
        this.logger.warn({
          code: AI_ERRORS.CONTENT_CHUNK_FAILED,
          contentId,
          chunkIndex: chunk.chunkIndex,
          error: result.error.code,
        });
        continue; // Best-effort: skip failed chunks
      }
      storedCount++;
    }

    // 6. Emit content indexed event
    void this.eventBus.publish('ai-core.content.indexed', {
      contentId,
      contentType,
      chunkCount: storedCount,
      source,
    });

    return ok(storedCount);
  }

  // Arabic text approximation: 4 chars/token may produce chunks ~50-100% larger in token count.
  // 16x headroom to model limit (8192 vs 500) prevents failures.
  /** Chunk content into overlapping segments (character-based with word boundary) */
  chunkContent(text: string, metadata: Record<string, unknown>): ContentChunk[] {
    const chunkSizeChars = this.chunkingConfig.chunkSizeTokens * 4;
    const overlapChars = this.chunkingConfig.overlapTokens * 4;
    const chunks: ContentChunk[] = [];

    let start = 0;
    while (start < text.length) {
      // Find a word boundary near chunkSizeChars
      let end = Math.min(start + chunkSizeChars, text.length);
      if (end < text.length) {
        // Back up to last space to avoid splitting words
        const lastSpace = text.lastIndexOf(' ', end);
        if (lastSpace > start) end = lastSpace;
      }

      chunks.push({
        text: text.slice(start, end),
        chunkIndex: chunks.length,
        totalChunks: 0, // Set after loop
        metadata,
      });

      start = end - overlapChars;
      if (start >= text.length || end === text.length) break;
    }

    // Set totalChunks
    for (const chunk of chunks) {
      chunk.totalChunks = chunks.length;
    }

    return chunks;
  }

  /** Sanitize PII from content before embedding */
  sanitizePII(content: string): string {
    let sanitized = content;
    // National IDs first (Egyptian-style: 14 digits) — must run before phone to avoid overlap
    sanitized = sanitized.replace(/\b\d{14}\b/g, '[NATIONAL_ID]');
    // Email addresses
    sanitized = sanitized.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[EMAIL]');
    // Phone numbers (international and local)
    sanitized = sanitized.replace(/\+?\d{10,15}/g, '[PHONE]');
    return sanitized;
  }
}
