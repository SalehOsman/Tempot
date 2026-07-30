import type { HelpAssistantQuestion } from '../bot-server.types.js';
import type { RAGContext } from './help-ai-rag.types.js';

const WEAK_CROSS_LANGUAGE_CONFIDENCE = 0.45;

export function hasUsableHelpContext(input: HelpAssistantQuestion, context: RAGContext): boolean {
  return filterUsableHelpContext(input, context).sources.length > 0;
}

export function filterUsableHelpContext(
  input: HelpAssistantQuestion,
  context: RAGContext,
): RAGContext {
  if (!context.hasResults || context.sources.length === 0)
    return { hasResults: false, context: '', sources: [] };
  const preferredSources = preferredLanguageSources(input, context);
  const sources =
    preferredSources.length > 0 ? preferredSources : context.sources.filter(isStrongSource);
  return { ...context, hasResults: sources.length > 0, sources };
}

function isStrongSource(source: RAGContext['sources'][number]): boolean {
  return source.score >= WEAK_CROSS_LANGUAGE_CONFIDENCE;
}

function preferredLanguageSources(
  input: HelpAssistantQuestion,
  context: RAGContext,
): RAGContext['sources'] {
  const preferredLanguage = input.locale.startsWith('ar') ? 'ar' : 'en';
  return context.sources.filter((source) => readLanguage(source.metadata) === preferredLanguage);
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
