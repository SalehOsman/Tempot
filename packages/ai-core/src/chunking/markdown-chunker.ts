import { ok, type Result } from 'neverthrow';
import type { ContentChunk } from '../ai-core.types.js';

/** Default maximum tokens per chunk before paragraph-level splitting */
const DEFAULT_MAX_TOKENS_PER_CHUNK = 8_000;

/** Approximate characters per token (conservative for mixed Arabic/English) */
const CHARS_PER_TOKEN = 4;

/** Regex to match YAML frontmatter at the start of a document */
const FRONTMATTER_RE = /^---\r?\n[\s\S]*?\r?\n---\r?\n*/;

/** Regex to match ## or ### headings */
const HEADING_RE = /^(#{2,3})\s+(.+)$/;
const ENGLISH_DOC_ROOTS = new Set([
  'README.md',
  'ai-context',
  'architecture',
  'development',
  'governance',
  'modules',
  'operations',
  'packages',
  'reference',
  'start-here',
]);

interface CorpusProfile {
  corpusSegment: string;
  sourcePriority: number;
  sourceOfTruth: boolean;
}

const CORPUS_PROFILES: Readonly<Record<string, CorpusProfile>> = {
  ar: { corpusSegment: 'localized-product', sourcePriority: 70, sourceOfTruth: false },
  en: { corpusSegment: 'localized-product', sourcePriority: 70, sourceOfTruth: false },
  governance: { corpusSegment: 'source-of-truth', sourcePriority: 100, sourceOfTruth: true },
  architecture: { corpusSegment: 'source-of-truth', sourcePriority: 95, sourceOfTruth: true },
  'ai-context': { corpusSegment: 'source-of-truth', sourcePriority: 90, sourceOfTruth: true },
  'start-here': { corpusSegment: 'source-of-truth', sourcePriority: 85, sourceOfTruth: true },
  development: { corpusSegment: 'source-of-truth', sourcePriority: 80, sourceOfTruth: true },
  operations: { corpusSegment: 'source-of-truth', sourcePriority: 80, sourceOfTruth: true },
  modules: { corpusSegment: 'package-docs', sourcePriority: 75, sourceOfTruth: false },
  packages: { corpusSegment: 'package-docs', sourcePriority: 75, sourceOfTruth: false },
  reference: { corpusSegment: 'generated-reference', sourcePriority: 20, sourceOfTruth: false },
};

/** Options for Markdown-aware chunking */
export interface MarkdownChunkOptions {
  /** Path to the source file, relative to docs/product/ */
  filePath: string;
  /** Maximum tokens per chunk before paragraph splitting (default 8000) */
  maxTokensPerChunk?: number;
}

/** A raw section extracted from the Markdown document */
interface MarkdownSection {
  title: string;
  content: string;
}

/**
 * Chunk a Markdown document by heading boundaries (## and ###).
 *
 * - Strips YAML frontmatter before processing
 * - Splits at ## and ### heading boundaries
 * - Sections under the token limit remain intact
 * - Sections exceeding the limit are split at paragraph boundaries
 * - Empty sections are skipped
 * - Metadata includes filePath, section, and language
 */
export function chunkMarkdown(
  markdown: string,
  options: MarkdownChunkOptions,
): Result<ContentChunk[], never> {
  const maxTokens = options.maxTokensPerChunk ?? DEFAULT_MAX_TOKENS_PER_CHUNK;
  const maxChars = maxTokens * CHARS_PER_TOKEN;
  const language = deriveLanguage(options.filePath);
  const corpusProfile = deriveCorpusProfile(options.filePath);

  // 1. Strip frontmatter
  const body = markdown.replace(FRONTMATTER_RE, '');

  // 2. Parse into sections by headings
  const sections = parseSections(body);

  // 3. Build chunks — split large sections at paragraph boundaries
  const rawChunks: Array<{ text: string; section: string }> = [];

  for (const section of sections) {
    const trimmed = section.content.trim();
    if (trimmed.length === 0) continue; // skip empty sections

    if (trimmed.length <= maxChars) {
      rawChunks.push({ text: trimmed, section: section.title });
    } else {
      const subChunks = splitAtParagraphs(trimmed, maxChars);
      for (const sub of subChunks) {
        rawChunks.push({ text: sub, section: section.title });
      }
    }
  }

  // 4. Build ContentChunk[] with correct indices and metadata
  const totalChunks = rawChunks.length;
  const chunks: ContentChunk[] = rawChunks.map((raw, index) => ({
    text: raw.text,
    chunkIndex: index,
    totalChunks,
    metadata: {
      filePath: options.filePath,
      section: raw.section,
      language,
      corpusSegment: corpusProfile.corpusSegment,
      sourcePriority: corpusProfile.sourcePriority,
      sourceOfTruth: corpusProfile.sourceOfTruth,
    },
  }));

  return ok(chunks);
}

/** Parse Markdown body into sections split at ## and ### headings */
function parseSections(body: string): MarkdownSection[] {
  const lines = body.split('\n');
  const sections: MarkdownSection[] = [];
  let currentTitle = '(untitled)';
  let currentLines: string[] = [];

  for (const line of lines) {
    const match = HEADING_RE.exec(line);
    if (match) {
      // Flush previous section
      if (currentLines.length > 0 || sections.length === 0) {
        sections.push({
          title: currentTitle,
          content: currentLines.join('\n'),
        });
      }
      currentTitle = match[2].trim();
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  // Flush final section
  sections.push({
    title: currentTitle,
    content: currentLines.join('\n'),
  });

  return sections;
}

/** Split text at paragraph boundaries (double newlines) to stay under maxChars */
function splitAtParagraphs(text: string, maxChars: number): string[] {
  const paragraphs = text.split(/\n\n+/);
  const result: string[] = [];
  let buffer = '';

  for (const paragraph of paragraphs) {
    const candidate = buffer.length > 0 ? `${buffer}\n\n${paragraph}` : paragraph;

    if (candidate.length > maxChars && buffer.length > 0) {
      result.push(buffer.trim());
      buffer = paragraph;
    } else {
      buffer = candidate;
    }
  }

  if (buffer.trim().length > 0) {
    result.push(buffer.trim());
  }

  return result;
}

/** Derive language code from filePath (first segment: ar/ or en/) */
function deriveLanguage(filePath: string): string {
  const firstSegment = filePath.replace(/\\/g, '/').split('/')[0];
  if (firstSegment === 'ar' || firstSegment === 'en') return firstSegment;
  return ENGLISH_DOC_ROOTS.has(firstSegment) ? 'en' : 'unknown';
}

function deriveCorpusProfile(filePath: string): CorpusProfile {
  const firstSegment = filePath.replace(/\\/g, '/').split('/')[0];
  return (
    CORPUS_PROFILES[firstSegment] ?? {
      corpusSegment: 'unknown',
      sourcePriority: 0,
      sourceOfTruth: false,
    }
  );
}
