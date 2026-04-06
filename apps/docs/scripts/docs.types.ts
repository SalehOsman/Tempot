import type { ContentIngestionService } from '@tempot/ai-core';

/** Frontmatter schema for all documentation pages */
export interface DocFrontmatter {
  title: string;
  description: string;
  tags: string[];
  audience: DocAudience[];
  package?: string;
  contentType: 'developer-docs';
  difficulty?: DocDifficulty;
}

export type DocAudience = 'package-developer' | 'bot-developer' | 'operator' | 'end-user';

export type DocDifficulty = 'beginner' | 'intermediate' | 'advanced';

/** Configuration for the AI documentation generation pipeline */
export interface DocGenerationConfig {
  packageName: string;
  specDir: string;
  sourceDir: string;
  outputDir: string;
  locale: 'ar' | 'en';
}

/** Chunk metadata for RAG ingestion */
export interface DocChunkMetadata {
  filePath: string;
  section: string;
  language: string;
  package?: string;
  contentHash: string;
}

/** Output of the freshness detection script */
export interface FreshnessReport {
  package: string;
  sourceFile: string;
  docFile: string;
  sourceMtime: string;
  docMtime: string;
  isStale: boolean;
}

/** CLI arguments for the ingestion script */
export interface IngestCliArgs {
  full: boolean;
  dryRun: boolean;
}

/** Dependencies injected into ingestFile for testability */
export interface IngestFileDeps {
  ingestionService: ContentIngestionService;
}

/** Input for building chunk metadata */
export interface ChunkMetadataInput {
  filePath: string;
  section: string;
  packageName: string | undefined;
  fileContent: string;
}

/** Result from processFiles helper */
export interface ProcessFilesResult {
  readonly processed: number;
  readonly skipped: number;
  readonly hashes: Record<string, string>;
}
