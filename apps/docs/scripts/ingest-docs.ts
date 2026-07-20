import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import { chunkMarkdown } from '@tempot/ai-core';
import type { IngestOptions } from '@tempot/ai-core';
import { parseFrontmatter } from './parse-frontmatter.js';
import type {
  DocChunkMetadata,
  DocsIngestionRunnerDeps,
  IngestCliArgs,
  IngestFileDeps,
  ChunkMetadataInput,
  ProcessFilesResult,
} from './docs.types.js';
import {
  deriveCorpusProfileFromDocPath,
  deriveLanguageFromDocPath,
  discoverMarkdownFilesSync,
} from './doc-discovery.js';

export type {
  DocsIngestionRunnerDeps,
  IngestCliArgs,
  IngestFileDeps,
  ChunkMetadataInput,
} from './docs.types.js';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '../../..');
const DOCS_PRODUCT_DIR = resolve(REPO_ROOT, 'docs/product');
const HASHES_FILE = resolve(REPO_ROOT, 'apps/docs/.docs-hashes.json');

/** Discover .md files under docs/product/ — sync existence check */
export function discoverDocFiles(): Result<string[], AppError> {
  if (!existsSync(DOCS_PRODUCT_DIR)) {
    return err(new AppError('DOCS.DISCOVER_FAILED', { reason: `Not found: ${DOCS_PRODUCT_DIR}` }));
  }
  try {
    return ok(discoverMarkdownFilesSync(DOCS_PRODUCT_DIR));
  } catch (error: unknown) {
    return err(new AppError('DOCS.DISCOVER_FAILED', { reason: String(error) }));
  }
}

/** Async discovery — reads directory recursively */
export async function discoverDocFilesAsync(): AsyncResult<string[], AppError> {
  if (!existsSync(DOCS_PRODUCT_DIR)) {
    return err(new AppError('DOCS.DISCOVER_FAILED', { reason: `Not found: ${DOCS_PRODUCT_DIR}` }));
  }
  try {
    const entries = await readdir(DOCS_PRODUCT_DIR, { recursive: true });
    return ok((entries as string[]).filter((f) => f.endsWith('.md')));
  } catch (error: unknown) {
    return err(new AppError('DOCS.DISCOVER_FAILED', { reason: String(error) }));
  }
}

/** Extract YAML frontmatter from Markdown content */
export function extractFrontmatter(content: string): Record<string, unknown> | undefined {
  return parseFrontmatter(content);
}

/** Compute SHA-256 hash of content */
export function computeContentHash(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

/** Derive language from file path (first segment: ar/ or en/) */
export function deriveLanguage(filePath: string): string {
  return deriveLanguageFromDocPath(filePath);
}

/** Build metadata for a chunk — hash from actual file content */
export function buildChunkMetadata(input: ChunkMetadataInput): DocChunkMetadata {
  const corpusProfile = deriveCorpusProfileFromDocPath(input.filePath);
  return {
    filePath: input.filePath,
    section: input.section,
    language: deriveLanguage(input.filePath),
    corpusSegment: corpusProfile.corpusSegment,
    sourcePriority: corpusProfile.sourcePriority,
    sourceOfTruth: corpusProfile.sourceOfTruth,
    package: input.packageName,
    contentHash: computeContentHash(input.fileContent),
  };
}

/** Check whether a file should be skipped based on hash */
export function shouldSkipFile(
  filePath: string,
  currentHash: string,
  existingHashes: Record<string, string>,
): boolean {
  return existingHashes[filePath] === currentHash;
}

/** Load existing hashes from disk */
async function loadHashes(): Promise<Record<string, string>> {
  if (!existsSync(HASHES_FILE)) return {};
  const raw = await readFile(HASHES_FILE, 'utf-8');
  return JSON.parse(raw) as Record<string, string>;
}

/** Save hashes to disk */
async function saveHashes(hashes: Record<string, string>): Promise<void> {
  await writeFile(HASHES_FILE, JSON.stringify(hashes, null, 2) + '\n');
}

/** Parse CLI arguments */
export function parseIngestCliArgs(args: string[]): IngestCliArgs {
  const write = args.includes('--write');
  const pathIndex = args.indexOf('--path');
  return {
    full: args.includes('--full'),
    dryRun: args.includes('--dry-run') || !write,
    write,
    path: pathIndex >= 0 ? args[pathIndex + 1] : undefined,
  };
}

/** Ingest a single file: chunk with chunkMarkdown, store via ContentIngestionService */
export async function ingestFile(
  filePath: string,
  content: string,
  deps: IngestFileDeps,
): AsyncResult<number, AppError> {
  const chunkResult = chunkMarkdown(content, { filePath });
  if (chunkResult.isErr()) return err(new AppError('DOCS.CHUNK_FAILED', { filePath }));
  const chunks = chunkResult.value;
  if (chunks.length === 0) return ok(0);
  let totalStored = 0;
  for (const chunk of chunks) {
    const contentId = `docs:${filePath}:${String(chunk.chunkIndex)}`;
    const options: IngestOptions = {
      contentId,
      contentType: 'developer-docs',
      content: chunk.text,
      metadata: { ...chunk.metadata, chunkIndex: chunk.chunkIndex, totalChunks: chunk.totalChunks },
      source: 'auto',
      strict: true,
    };
    const result = await deps.ingestionService.ingest(options);
    if (result.isErr()) {
      return err(
        new AppError('DOCS.INGEST_FAILED', {
          filePath,
          contentId,
          code: result.error.code,
          details: result.error.details,
        }),
      );
    }
    if (result.value < 1) {
      return err(new AppError('DOCS.INGEST_FAILED', { filePath, contentId, stored: 0 }));
    }
    totalStored += result.value;
  }
  return ok(totalStored);
}

/** Process discovered files: hash, skip unchanged, preview or write changed files. */
export async function runDocsIngestion(
  args: IngestCliArgs,
  deps: DocsIngestionRunnerDeps,
): AsyncResult<ProcessFilesResult, AppError> {
  const runner = await import('./ingest-runner.js');
  return runner.runDocsIngestion(args, deps);
}

/** CLI entry point */
async function main(): Promise<void> {
  const args = parseIngestCliArgs(process.argv.slice(2));
  const result = await runDocsIngestion(args, {
    discoverFiles: discoverDocFilesAsync,
    readFileContent: async (file) => readFile(`${DOCS_PRODUCT_DIR}/${file}`, 'utf-8'),
    loadHashes,
    saveHashes,
    log: (record) => {
      process.stderr.write(JSON.stringify(record) + '\n');
    },
  });

  if (result.isErr()) {
    process.stderr.write(
      JSON.stringify({
        level: 'error',
        msg: result.error.code,
        details: result.error.details,
      }) + '\n',
    );
    process.exitCode = 1;
    return;
  }

  process.stderr.write(
    JSON.stringify({
      level: 'info',
      msg: 'ingestion-complete',
      processed: result.value.processed,
      skipped: result.value.skipped,
      failed: result.value.failed,
      hashesWritten: result.value.hashesWritten,
    }) + '\n',
  );
}

const isDirectExecution =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  /ingest-docs\.(ts|js)$/.test(process.argv[1].replace(/\\/g, '/'));

if (isDirectExecution) {
  main().catch((error: unknown) => {
    process.stderr.write(JSON.stringify({ level: 'error', msg: String(error) }) + '\n');
    process.exitCode = 1;
  });
}
