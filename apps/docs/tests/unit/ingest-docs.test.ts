import { describe, it, expect, vi, beforeEach } from 'vitest';
import { err, ok } from 'neverthrow';
import type { DocChunkMetadata } from '../../scripts/docs.types.js';

vi.mock('node:fs/promises');
vi.mock('node:fs', () => ({
  existsSync: vi.fn(() => true),
}));
vi.mock('@tempot/ai-core', () => ({
  chunkMarkdown: vi.fn(),
}));

describe('ingestDocs', () => {
  let discoverDocFiles: typeof import('../../scripts/ingest-docs.js').discoverDocFiles;
  let discoverDocFilesAsync: typeof import('../../scripts/ingest-docs.js').discoverDocFilesAsync;
  let extractFrontmatter: typeof import('../../scripts/ingest-docs.js').extractFrontmatter;
  let computeContentHash: typeof import('../../scripts/ingest-docs.js').computeContentHash;
  let buildChunkMetadata: typeof import('../../scripts/ingest-docs.js').buildChunkMetadata;
  let shouldSkipFile: typeof import('../../scripts/ingest-docs.js').shouldSkipFile;
  let parseIngestCliArgs: typeof import('../../scripts/ingest-docs.js').parseIngestCliArgs;
  let ingestFile: typeof import('../../scripts/ingest-docs.js').ingestFile;
  let runDocsIngestion: typeof import('../../scripts/ingest-docs.js').runDocsIngestion;
  let readdir: typeof import('node:fs/promises').readdir;
  let existsSync: typeof import('node:fs').existsSync;
  let chunkMarkdown: typeof import('@tempot/ai-core').chunkMarkdown;

  beforeEach(async () => {
    vi.resetModules();

    const fsPromises = await import('node:fs/promises');
    readdir = fsPromises.readdir;

    const fs = await import('node:fs');
    existsSync = fs.existsSync;

    const aiCore = await import('@tempot/ai-core');
    chunkMarkdown = aiCore.chunkMarkdown;
    vi.clearAllMocks();
    vi.mocked(existsSync).mockReturnValue(true);

    const mod = await import('../../scripts/ingest-docs.js');
    discoverDocFiles = mod.discoverDocFiles;
    discoverDocFilesAsync = mod.discoverDocFilesAsync;
    extractFrontmatter = mod.extractFrontmatter;
    computeContentHash = mod.computeContentHash;
    buildChunkMetadata = mod.buildChunkMetadata;
    shouldSkipFile = mod.shouldSkipFile;
    parseIngestCliArgs = mod.parseIngestCliArgs;
    ingestFile = mod.ingestFile;
    runDocsIngestion = mod.runDocsIngestion;
  });

  it('discoverDocFiles returns ok([]) when directory exists', () => {
    vi.mocked(existsSync).mockReturnValueOnce(true);
    const result = discoverDocFiles();
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual([]);
    }
  });

  it('discoverDocFiles returns err when directory missing', () => {
    vi.mocked(existsSync).mockReturnValueOnce(false);
    const result = discoverDocFiles();
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe('DOCS.DISCOVER_FAILED');
    }
  });

  it('discoverDocFilesAsync returns .md files recursively', async () => {
    vi.mocked(existsSync).mockReturnValueOnce(true);
    vi.mocked(readdir).mockResolvedValueOnce([
      'ar/tutorials/getting-started.md',
      'en/tutorials/getting-started.md',
      'ar/index.md',
      'en/index.md',
    ] as unknown as Awaited<ReturnType<typeof readdir>>);

    const result = await discoverDocFilesAsync();
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toHaveLength(4);
      expect(result.value).toContain('ar/tutorials/getting-started.md');
    }
  });

  it('discoverDocFilesAsync returns err when directory missing', async () => {
    vi.mocked(existsSync).mockReturnValueOnce(false);
    const result = await discoverDocFilesAsync();
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe('DOCS.DISCOVER_FAILED');
    }
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

  it('builds chunk metadata with hash from file content', () => {
    const fileContent = '# Full file content here\n\nSome body text.';
    const metadata: DocChunkMetadata = buildChunkMetadata({
      filePath: 'en/tutorials/getting-started.md',
      section: 'Getting Started',
      packageName: 'shared',
      fileContent,
    });

    expect(metadata.filePath).toBe('en/tutorials/getting-started.md');
    expect(metadata.section).toBe('Getting Started');
    expect(metadata.language).toBe('en');
    expect(metadata.package).toBe('shared');
    expect(metadata.contentHash).toBe(computeContentHash(fileContent));
  });

  it('detects language from file path', () => {
    const arMeta = buildChunkMetadata({
      filePath: 'ar/guides/module.md',
      section: 'Module',
      packageName: undefined,
      fileContent: 'content',
    });
    expect(arMeta.language).toBe('ar');

    const enMeta = buildChunkMetadata({
      filePath: 'en/concepts/arch.md',
      section: 'Arch',
      packageName: undefined,
      fileContent: 'content',
    });
    expect(enMeta.language).toBe('en');

    const unknownMeta = buildChunkMetadata({
      filePath: 'fr/other.md',
      section: 'Other',
      packageName: undefined,
      fileContent: 'content',
    });
    expect(unknownMeta.language).toBe('unknown');
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

  it('does not skip any files when hashes are empty', () => {
    const skip = shouldSkipFile('en/tutorials/getting-started.md', 'abc123def456', {});
    expect(skip).toBe(false);
  });

  it('parseIngestCliArgs extracts --full flag', () => {
    const args = parseIngestCliArgs(['--full']);
    expect(args.full).toBe(true);
    expect(args.dryRun).toBe(true);
    expect(args.write).toBe(false);
    expect(args.path).toBeUndefined();
  });

  it('parseIngestCliArgs extracts --dry-run flag', () => {
    const args = parseIngestCliArgs(['--dry-run']);
    expect(args.full).toBe(false);
    expect(args.dryRun).toBe(true);
    expect(args.write).toBe(false);
    expect(args.path).toBeUndefined();
  });

  it('parseIngestCliArgs extracts --write flag', () => {
    const args = parseIngestCliArgs(['--write']);
    expect(args.full).toBe(false);
    expect(args.dryRun).toBe(false);
    expect(args.write).toBe(true);
    expect(args.path).toBeUndefined();
  });

  it('parseIngestCliArgs extracts --path value', () => {
    const args = parseIngestCliArgs(['--write', '--path', 'en/guides']);
    expect(args.path).toBe('en/guides');
  });

  it('parseIngestCliArgs defaults to safe incremental dry-run', () => {
    const args = parseIngestCliArgs([]);
    expect(args.full).toBe(false);
    expect(args.dryRun).toBe(true);
    expect(args.write).toBe(false);
    expect(args.path).toBeUndefined();
  });

  describe('runDocsIngestion', () => {
    it('does not save hashes or create runtime dependencies in dry-run mode', async () => {
      const logs: unknown[] = [];
      const saveHashes = vi.fn();
      const createRuntime = vi.fn();

      vi.mocked(chunkMarkdown).mockReturnValueOnce(
        ok([{ text: 'chunk', chunkIndex: 0, totalChunks: 1, metadata: {} }]),
      );

      const result = await runDocsIngestion(parseIngestCliArgs(['--dry-run']), {
        discoverFiles: async () => ok(['en/test.md']),
        readFileContent: async () => '# Test',
        loadHashes: async () => ({}),
        saveHashes,
        createRuntime,
        log: (record) => logs.push(record),
      });

      expect(result.isOk()).toBe(true);
      expect(saveHashes).not.toHaveBeenCalled();
      expect(createRuntime).not.toHaveBeenCalled();
      expect(logs).toContainEqual(
        expect.objectContaining({
          msg: 'dry-run',
          file: 'en/test.md',
          chunkCount: 1,
        }),
      );
    });

    it('writes only successful file hashes in write mode', async () => {
      const { AppError } = await import('@tempot/shared');
      const mockIngest = vi
        .fn()
        .mockResolvedValueOnce(ok(1))
        .mockResolvedValueOnce(err(new AppError('EMBED_FAILED')));
      const saveHashes = vi.fn();

      vi.mocked(chunkMarkdown)
        .mockReturnValueOnce(ok([{ text: 'ok', chunkIndex: 0, totalChunks: 1, metadata: {} }]))
        .mockReturnValueOnce(ok([{ text: 'bad', chunkIndex: 0, totalChunks: 1, metadata: {} }]));

      const result = await runDocsIngestion(parseIngestCliArgs(['--write']), {
        discoverFiles: async () => ok(['en/ok.md', 'en/bad.md']),
        readFileContent: async (filePath) => `# ${filePath}`,
        loadHashes: async () => ({}),
        saveHashes,
        createRuntime: async () =>
          ok({
            ingestionService: {
              ingest: mockIngest,
            } as unknown as import('@tempot/ai-core').ContentIngestionService,
            close: vi.fn(),
          }),
        log: vi.fn(),
      });

      expect(result.isOk()).toBe(false);
      expect(saveHashes).toHaveBeenCalledTimes(1);
      expect(saveHashes).toHaveBeenCalledWith({
        'en/ok.md': computeContentHash('# en/ok.md'),
      });
    });

    it('processes unchanged files when write mode uses --full', async () => {
      const mockIngest = vi.fn().mockResolvedValue(ok(1));
      const existingHash = computeContentHash('# Same');

      vi.mocked(chunkMarkdown).mockReturnValueOnce(
        ok([{ text: 'same', chunkIndex: 0, totalChunks: 1, metadata: {} }]),
      );

      const result = await runDocsIngestion(parseIngestCliArgs(['--write', '--full']), {
        discoverFiles: async () => ok(['en/same.md']),
        readFileContent: async () => '# Same',
        loadHashes: async () => ({ 'en/same.md': existingHash }),
        saveHashes: vi.fn(),
        createRuntime: async () =>
          ok({
            ingestionService: {
              ingest: mockIngest,
            } as unknown as import('@tempot/ai-core').ContentIngestionService,
            close: vi.fn(),
          }),
        log: vi.fn(),
      });

      expect(result.isOk()).toBe(true);
      expect(mockIngest).toHaveBeenCalledTimes(1);
      if (result.isOk()) {
        expect(result.value.processed).toBe(1);
        expect(result.value.skipped).toBe(0);
      }
    });

    it('limits processing to a requested path', async () => {
      const logs: unknown[] = [];

      vi.mocked(chunkMarkdown)
        .mockReturnValueOnce(ok([{ text: 'one', chunkIndex: 0, totalChunks: 1, metadata: {} }]))
        .mockReturnValueOnce(ok([{ text: 'two', chunkIndex: 0, totalChunks: 1, metadata: {} }]));

      const result = await runDocsIngestion(parseIngestCliArgs(['--dry-run', '--path', 'en']), {
        discoverFiles: async () => ok(['en/index.md', 'ar/index.md', 'en/guides/module.md']),
        readFileContent: async (filePath) => `# ${filePath}`,
        loadHashes: async () => ({}),
        saveHashes: vi.fn(),
        createRuntime: vi.fn(),
        log: (record) => logs.push(record),
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.processed).toBe(2);
      }
      expect(logs).toEqual([
        expect.objectContaining({ file: 'en/index.md' }),
        expect.objectContaining({ file: 'en/guides/module.md' }),
      ]);
    });
  });

  describe('ingestFile', () => {
    it('chunks content and calls ingestionService.ingest per chunk', async () => {
      const mockIngest = vi.fn().mockResolvedValue(ok(1));
      const deps = {
        ingestionService: {
          ingest: mockIngest,
        } as unknown as import('@tempot/ai-core').ContentIngestionService,
      };

      vi.mocked(chunkMarkdown).mockReturnValueOnce(
        ok([
          {
            text: 'chunk-0',
            chunkIndex: 0,
            totalChunks: 2,
            metadata: { filePath: 'en/test.md', section: 'Intro', language: 'en' },
          },
          {
            text: 'chunk-1',
            chunkIndex: 1,
            totalChunks: 2,
            metadata: { filePath: 'en/test.md', section: 'Body', language: 'en' },
          },
        ]),
      );

      const result = await ingestFile('en/test.md', '# Test\n\nContent', deps);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(2);
      }
      expect(mockIngest).toHaveBeenCalledTimes(2);
      expect(mockIngest).toHaveBeenCalledWith(
        expect.objectContaining({
          contentId: 'docs:en/test.md:0',
          contentType: 'developer-docs',
          content: 'chunk-0',
          source: 'auto',
        }),
      );
    });

    it('returns ok(0) when chunkMarkdown yields empty array', async () => {
      const mockIngest = vi.fn();
      const deps = {
        ingestionService: {
          ingest: mockIngest,
        } as unknown as import('@tempot/ai-core').ContentIngestionService,
      };

      vi.mocked(chunkMarkdown).mockReturnValueOnce(ok([]));

      const result = await ingestFile('en/empty.md', '', deps);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(0);
      }
      expect(mockIngest).not.toHaveBeenCalled();
    });

    it('returns err when any chunk ingestion fails', async () => {
      const { AppError } = await import('@tempot/shared');

      const mockIngest = vi
        .fn()
        .mockResolvedValueOnce(ok(1))
        .mockResolvedValueOnce(err(new AppError('EMBED_FAILED')))
        .mockResolvedValueOnce(ok(1));

      const deps = {
        ingestionService: {
          ingest: mockIngest,
        } as unknown as import('@tempot/ai-core').ContentIngestionService,
      };

      vi.mocked(chunkMarkdown).mockReturnValueOnce(
        ok([
          { text: 'c0', chunkIndex: 0, totalChunks: 3, metadata: {} },
          { text: 'c1', chunkIndex: 1, totalChunks: 3, metadata: {} },
          { text: 'c2', chunkIndex: 2, totalChunks: 3, metadata: {} },
        ]),
      );

      const result = await ingestFile('en/partial.md', 'content', deps);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('DOCS.INGEST_FAILED');
      }
    });

    it('passes chunk metadata through to ingest options', async () => {
      const mockIngest = vi.fn().mockResolvedValue(ok(1));
      const deps = {
        ingestionService: {
          ingest: mockIngest,
        } as unknown as import('@tempot/ai-core').ContentIngestionService,
      };

      vi.mocked(chunkMarkdown).mockReturnValueOnce(
        ok([
          {
            text: 'text',
            chunkIndex: 0,
            totalChunks: 1,
            metadata: { filePath: 'ar/doc.md', section: 'Intro', language: 'ar' },
          },
        ]),
      );

      await ingestFile('ar/doc.md', '# Arabic doc', deps);

      expect(mockIngest).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            filePath: 'ar/doc.md',
            section: 'Intro',
            language: 'ar',
            chunkIndex: 0,
            totalChunks: 1,
          }),
        }),
      );
    });
  });
});
