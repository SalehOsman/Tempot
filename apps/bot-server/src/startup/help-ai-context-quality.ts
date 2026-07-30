import type { HelpAssistantQuestion } from '../bot-server.types.js';
import type { RAGContext } from './help-ai-rag.types.js';

const WEAK_CROSS_LANGUAGE_CONFIDENCE = 0.45;

export function hasUsableHelpContext(input: HelpAssistantQuestion, context: RAGContext): boolean {
  if (!context.hasResults || context.sources.length === 0) return false;
  if (topScore(context) >= WEAK_CROSS_LANGUAGE_CONFIDENCE) return true;
  return hasPreferredLanguageSource(input, context);
}

function topScore(context: RAGContext): number {
  return context.sources[0]?.score ?? 0;
}

function hasPreferredLanguageSource(input: HelpAssistantQuestion, context: RAGContext): boolean {
  const preferredLanguage = input.locale.startsWith('ar') ? 'ar' : 'en';
  return context.sources.some((source) => readLanguage(source.metadata) === preferredLanguage);
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
