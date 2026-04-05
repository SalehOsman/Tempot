import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DocChunkMetadata } from '../../scripts/docs.types.js';

vi.mock('node:fs/promises');

describe('ingestDocs', () => {
  let discoverDocFiles: typeof import('../../scripts/ingest-docs.js').discoverDocFiles;
  let extractFrontmatter: typeof import('../../scripts/ingest-docs.js').extractFrontmatter;
  let computeContentHash: typeof import('../../scripts/ingest-docs.js').computeContentHash;
  let buildChunkMetadata: typeof import('../../scripts/ingest-docs.js').buildChunkMetadata;
  let shouldSkipFile: typeof import('../../scripts/ingest-docs.js').shouldSkipFile;
  let parseIngestCliArgs: typeof import('../../scripts/ingest-docs.js').parseIngestCliArgs;
  let readdir: typeof import('node:fs/promises').readdir;

  beforeEach(async () => {
    vi.resetModules();

    const fsPromises = await import('node:fs/promises');
    readdir = fsPromises.readdir;

    const mod = await import('../../scripts/ingest-docs.js');
    discoverDocFiles = mod.discoverDocFiles;
    extractFrontmatter = mod.extractFrontmatter;
    computeContentHash = mod.computeContentHash;
    buildChunkMetadata = mod.buildChunkMetadata;
    shouldSkipFile = mod.shouldSkipFile;
    parseIngestCliArgs = mod.parseIngestCliArgs;
  });

  it('discovers all .md files from docs/product/ recursively', async () => {
    vi.mocked(readdir).mockResolvedValueOnce([
      'ar/tutorials/getting-started.md',
      'en/tutorials/getting-started.md',
      'ar/index.md',
      'en/index.md',
    ] as unknown as Awaited<ReturnType<typeof readdir>>);

    const files = await discoverDocFiles();
    expect(files).toHaveLength(4);
    expect(files).toContain('ar/tutorials/getting-started.md');
    expect(files).toContain('en/index.md');
  });

  it('extracts YAML frontmatter metadata from markdown content', () => {
    const markdown = [
      '---',
      'title: Getting Started',
      'description: A tutorial',
      'tags:',
      '  - tutorial',
      'audience:',
      '  - bot-developer',
      'contentType: developer-docs',
      'package: shared',
      '---',
      '',
      '## Hello',
    ].join('\n');

    const result = extractFrontmatter(markdown);
    expect(result).toBeDefined();
    expect(result!['title']).toBe('Getting Started');
    expect(result!['package']).toBe('shared');
    expect(result!['contentType']).toBe('developer-docs');
  });

  it('returns undefined for content without frontmatter', () => {
    const result = extractFrontmatter('## Just a heading\n\nNo frontmatter here.');
    expect(result).toBeUndefined();
  });

  it('computes SHA-256 content hash for a string', () => {
    const hash1 = computeContentHash('hello world');
    const hash2 = computeContentHash('hello world');
    const hash3 = computeContentHash('different content');

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/);
  });

  it('builds chunk metadata with correct fields', () => {
    const metadata: DocChunkMetadata = buildChunkMetadata(
      'en/tutorials/getting-started.md',
      'Getting Started',
      'shared',
    );

    expect(metadata.filePath).toBe('en/tutorials/getting-started.md');
    expect(metadata.section).toBe('Getting Started');
    expect(metadata.language).toBe('en');
    expect(metadata.package).toBe('shared');
    expect(metadata.contentHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('detects language from file path', () => {
    const arMeta = buildChunkMetadata('ar/guides/module.md', 'Module', undefined);
    expect(arMeta.language).toBe('ar');

    const enMeta = buildChunkMetadata('en/concepts/arch.md', 'Arch', undefined);
    expect(enMeta.language).toBe('en');
  });

  it('skips files with unchanged content hashes in incremental mode', () => {
    const existingHashes: Record<string, string> = {
      'en/tutorials/getting-started.md': 'abc123def456',
    };

    const skip = shouldSkipFile('en/tutorials/getting-started.md', 'abc123def456', existingHashes);
    expect(skip).toBe(true);

    const noSkip = shouldSkipFile(
      'en/tutorials/getting-started.md',
      'different-hash',
      existingHashes,
    );
    expect(noSkip).toBe(false);
  });

  it('does not skip any files in full mode', () => {
    // In full mode, shouldSkipFile is not called — but if passed empty hashes it returns false
    const skip = shouldSkipFile('en/tutorials/getting-started.md', 'abc123def456', {});
    expect(skip).toBe(false);
  });

  it('parseIngestCliArgs extracts --full flag', () => {
    const args = parseIngestCliArgs(['--full']);
    expect(args.full).toBe(true);
  });

  it('parseIngestCliArgs defaults to incremental mode', () => {
    const args = parseIngestCliArgs([]);
    expect(args.full).toBe(false);
  });
});
