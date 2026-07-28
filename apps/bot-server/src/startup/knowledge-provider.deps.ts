import type { AIContentType } from '@tempot/ai-core';
import type { Result } from 'neverthrow';
import type { ContentChunk } from '@tempot/ai-core';
import type { ModuleLogger } from '../bot-server.types.js';
import type {
  KnowledgeChatProvider,
  KnowledgeEmbeddingModel,
  KnowledgeEmbeddingProvider,
  KnowledgeProviderSettingsSnapshot,
} from '../module-providers.types.js';
import type { InternalKnowledgeProfile } from './knowledge-source-profiles.js';

export interface KnowledgeIngestInput {
  readonly contentId: string;
  readonly contentType: AIContentType;
  readonly content: string;
  readonly metadata: Record<string, unknown>;
}

export interface KnowledgeProviderDeps {
  readonly aiEnabled: () => boolean;
  readonly providerConfigured: () => Promise<boolean>;
  readonly providerSettings: () => Promise<KnowledgeProviderSettingsSnapshot>;
  readonly setChatProvider: (provider: KnowledgeChatProvider, actorId: string) => Promise<boolean>;
  readonly setEmbeddingProvider: (
    provider: KnowledgeEmbeddingProvider,
    actorId: string,
  ) => Promise<boolean>;
  readonly setEmbeddingModel: (model: KnowledgeEmbeddingModel, actorId: string) => Promise<boolean>;
  readonly databaseConfigured: () => boolean;
  readonly vectorReady: () => Promise<boolean>;
  readonly countEmbeddings: () => Promise<number>;
  readonly pathExists: (rootPath: string) => Promise<boolean>;
  readonly discoverMarkdownFiles: (rootPath: string) => Promise<string[]>;
  readonly readTextFile: (filePath: string) => Promise<string>;
  readonly chunkMarkdown: (
    content: string,
    filePath: string,
  ) => Promise<Result<ContentChunk[], never>>;
  readonly ingestContent: (input: KnowledgeIngestInput) => Promise<void>;
  readonly loadCustomProfiles: () => Promise<InternalKnowledgeProfile[]>;
  readonly saveCustomProfiles: (profiles: readonly InternalKnowledgeProfile[]) => Promise<void>;
  readonly logger: Pick<ModuleLogger, 'info' | 'warn' | 'error' | 'debug'>;
}
