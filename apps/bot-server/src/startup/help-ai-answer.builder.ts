import type { HelpAssistantAnswer, HelpAssistantQuestion } from '../bot-server.types.js';
import type { RAGContext } from './help-ai-rag.types.js';

const MAX_ANSWER_SNIPPETS = 3;

type Citation = { blockId: string; sourceId?: string };

export function buildHelpAssistantAnswer(
  input: HelpAssistantQuestion,
  context: RAGContext,
): HelpAssistantAnswer {
  return {
    state: 'answered',
    answer: buildExtractiveAnswer(input, context),
    citations: uniqueCitations(context),
    confidence: context.sources[0]?.score ?? 0,
  };
}

function buildExtractiveAnswer(input: HelpAssistantQuestion, context: RAGContext): string {
  const preferredLanguage = input.locale.startsWith('ar') ? 'ar' : 'en';
  const snippets = context.sources
    .map((source) => ({
      text: readText(source.metadata),
      language: readLanguage(source.metadata),
    }))
    .filter((snippet): snippet is { text: string; language: string } => Boolean(snippet.text))
    .sort(
      (left, right) =>
        languageRank(left.language, preferredLanguage) -
        languageRank(right.language, preferredLanguage),
    )
    .slice(0, MAX_ANSWER_SNIPPETS)
    .map((snippet) => cleanSnippet(snippet.text));
  if (snippets.length > 0) return snippets.join('\n\n');
  return extractAnswer(context.context);
}

function uniqueCitations(context: RAGContext): readonly Citation[] {
  const citations: Citation[] = [];
  const seen = new Set<string>();
  for (const source of context.sources) {
    const sourceId = readSourceId(source.metadata);
    const key = sourceId ?? source.contentId;
    if (seen.has(key)) continue;
    seen.add(key);
    citations.push({ blockId: source.contentId, sourceId });
  }
  return citations;
}

function extractAnswer(context: string): string {
  const normalized = context
    .replace(/\[[^\]]+\]\s*/u, '')
    .replace(/^.*?:\n/u, '')
    .trim();
  return normalized.split(/\n\n/u)[0]?.trim() ?? '';
}

function cleanSnippet(text: string): string {
  return text.replace(/\s+/gu, ' ').trim();
}

function readText(metadata: unknown): string | undefined {
  if (!isRecord(metadata)) return undefined;
  const text = metadata['text'];
  return typeof text === 'string' && text.trim() ? text : undefined;
}

function readLanguage(metadata: unknown): string {
  if (!isRecord(metadata)) return 'unknown';
  const language = metadata['language'];
  if (language === 'ar' || language === 'en') return language;
  return readLanguageFromPath(metadata['filePath']);
}

function readLanguageFromPath(filePath: unknown): string {
  if (typeof filePath !== 'string') return 'unknown';
  const segments = filePath.replace(/\\/gu, '/').split('/');
  if (segments.includes('ar')) return 'ar';
  if (segments.includes('en')) return 'en';
  return 'unknown';
}

function readSourceId(metadata: unknown): string | undefined {
  if (!isRecord(metadata)) return undefined;
  const filePath = metadata['filePath'];
  return typeof filePath === 'string' ? filePath : undefined;
}

function languageRank(language: string, preferredLanguage: string): number {
  return language === preferredLanguage ? 0 : 1;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
