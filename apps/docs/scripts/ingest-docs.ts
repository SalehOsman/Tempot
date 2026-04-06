import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import { chunkMarkdown } from '@tempot/ai-core';
import type { IngestOptions } from '@tempot/ai-core';
import { parseFrontmatter } from './parse-frontmatter.js';
import type {
  DocChunkMetadata,
  IngestCliArgs,
  IngestFileDeps,
  ChunkMetadataInput,
  ProcessFilesResult,
} from './docs.types.js';

export type { IngestCliArgs, IngestFileDeps, ChunkMetadataInput } from './docs.types.js';

const DOCS_PRODUCT_DIR = 'docs/product';
const HASHES_FILE = 'apps/docs/.docs-hashes.json';

/** Discover .md files under docs/product/ — sync existence check */
export function discoverDocFiles(): Result<string[], AppError> {
  if (!existsSync(DOCS_PRODUCT_DIR)) {
    return err(new AppError('DOCS.DISCOVER_FAILED', { reason: `Not found: ${DOCS_PRODUCT_DIR}` }));
  }
  return ok([]);
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
  const first = filePath.replace(/\\/g, '/').split('/')[0];
  return first === 'ar' || first === 'en' ? first : 'unknown';
}

/** Build metadata for a chunk — hash from actual file content */
export function buildChunkMetadata(input: ChunkMetadataInput): DocChunkMetadata {
  return {
    filePath: input.filePath,
    section: input.section,
    language: deriveLanguage(input.filePath),
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
  return { full: args.includes('--full'), dryRun: args.includes('--dry-run') };
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
    };
    const result = await deps.ingestionService.ingest(options);
    if (result.isOk()) totalStored += result.value;
  }
  return ok(totalStored);
}

/** Process discovered files: hash, skip unchanged, log dry-run info */
async function processFiles(
  files: string[],
  args: IngestCliArgs,
  existingHashes: Record<string, string>,
): Promise<ProcessFilesResult> {
  const hashes: Record<string, string> = {};
  let processed = 0;
  let skipped = 0;
  for (const file of files) {
    const content = await readFile(`${DOCS_PRODUCT_DIR}/${file}`, 'utf-8');
    const hash = computeContentHash(content);
    hashes[file] = hash;
    if (!args.full && shouldSkipFile(file, hash, existingHashes)) {
      skipped++;
      continue;
    }
    if (args.dryRun) {
      const fm = extractFrontmatter(content);
      process.stderr.write(
        JSON.stringify({
          level: 'info',
          msg: 'dry-run',
          file,
          language: deriveLanguage(file),
          package: (fm?.['package'] as string | undefined) ?? null,
          contentType: 'developer-docs',
          hash,
        }) + '\n',
      );
    }
    processed++;
  }
  return { processed, skipped, hashes };
}

/** CLI entry point */
async function main(): Promise<void> {
  const args = parseIngestCliArgs(process.argv.slice(2));
  const filesResult = await discoverDocFilesAsync();
  if (filesResult.isErr()) {
    process.stderr.write(
      JSON.stringify({
        level: 'error',
        msg: filesResult.error.code,
        details: filesResult.error.details,
      }) + '\n',
    );
    process.exitCode = 1;
    return;
  }
  const existingHashes = args.full ? {} : await loadHashes();
  const { processed, skipped, hashes } = await processFiles(
    filesResult.value,
    args,
    existingHashes,
  );
  await saveHashes(hashes);
  process.stderr.write(
    JSON.stringify({
      level: 'info',
      msg: `Ingestion complete: ${String(processed)} processed, ${String(skipped)} skipped.`,
    }) + '\n',
  );
}

const isDirectExecution =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  (process.argv[1].includes('ingest-docs') || process.argv[1].includes('tsx'));

if (isDirectExecution) {
  main().catch((error: unknown) => {
    process.stderr.write(JSON.stringify({ level: 'error', msg: String(error) }) + '\n');
    process.exitCode = 1;
  });
}
