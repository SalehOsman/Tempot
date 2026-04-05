import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { parseFrontmatter } from './parse-frontmatter.js';
import type { DocChunkMetadata } from './docs.types.js';

const DOCS_PRODUCT_DIR = 'docs/product';
const HASHES_FILE = 'apps/docs/.docs-hashes.json';

/** CLI arguments for the ingestion script */
export interface IngestCliArgs {
  full: boolean;
}

/** Discover all .md files recursively under docs/product/ */
export async function discoverDocFiles(): Promise<string[]> {
  const entries = await readdir(DOCS_PRODUCT_DIR, { recursive: true });
  return (entries as string[]).filter((f) => f.endsWith('.md'));
}

/** Extract YAML frontmatter as a record from Markdown content */
export function extractFrontmatter(content: string): Record<string, unknown> | undefined {
  return parseFrontmatter(content);
}

/** Compute SHA-256 hash of content */
export function computeContentHash(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

/** Derive language from file path (first segment: ar/ or en/) */
function deriveLanguage(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/');
  const first = normalized.split('/')[0];
  return first === 'ar' || first === 'en' ? first : 'unknown';
}

/** Build metadata for a chunk */
export function buildChunkMetadata(
  filePath: string,
  section: string,
  packageName: string | undefined,
): DocChunkMetadata {
  return {
    filePath,
    section,
    language: deriveLanguage(filePath),
    package: packageName,
    contentHash: computeContentHash(`${filePath}:${section}`),
  };
}

/** Check whether a file should be skipped based on hash comparison */
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
  return { full: args.includes('--full') };
}

/** CLI entry point */
async function main(): Promise<void> {
  const args = parseIngestCliArgs(process.argv.slice(2));
  const files = await discoverDocFiles();
  const existingHashes = args.full ? {} : await loadHashes();
  const newHashes: Record<string, string> = {};

  let processed = 0;
  let skipped = 0;

  for (const file of files) {
    const fullPath = `${DOCS_PRODUCT_DIR}/${file}`;
    const content = await readFile(fullPath, 'utf-8');
    const hash = computeContentHash(content);
    newHashes[file] = hash;

    if (!args.full && shouldSkipFile(file, hash, existingHashes)) {
      skipped++;
      continue;
    }

    const frontmatter = extractFrontmatter(content);
    const packageName = frontmatter?.['package'] as string | undefined;

    process.stdout.write(
      JSON.stringify({
        file,
        language: deriveLanguage(file),
        package: packageName ?? null,
        contentType: 'developer-docs',
        hash,
      }) + '\n',
    );

    processed++;
  }

  await saveHashes(newHashes);

  process.stdout.write(
    `Ingestion complete: ${String(processed)} processed, ${String(skipped)} skipped.\n`,
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
