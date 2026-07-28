const embeddingFailureSignals = [
  'ai-core.embedding.failed',
  'ai-core.content.chunk_failed',
] as const;

export function knowledgeIngestionFailureReason(error: unknown): string {
  const signals = collectErrorSignals(error);
  if (signals.some(hasQuotaFailureSignal)) return 'quota_exceeded';
  if (signals.some(hasEmbeddingFailureSignal)) return 'embedding_failed';
  if (signals.some(hasDatabaseFailureSignal)) return 'database_failed';
  return 'unknown';
}

function collectErrorSignals(error: unknown): string[] {
  if (error instanceof Error) return collectNativeErrorSignals(error);
  if (isRecord(error)) return collectRecordSignals(error);
  return [String(error)];
}

function collectNativeErrorSignals(error: Error): string[] {
  const signals = [error.message];
  const cause = (error as Error & { cause?: unknown }).cause;
  const details = (error as Error & { details?: unknown }).details;
  return [...signals, ...collectOptionalSignals(cause), ...collectOptionalSignals(details)];
}

function collectRecordSignals(error: Record<string, unknown>): string[] {
  const signals = [
    ...stringSignal(error['code']),
    ...stringSignal(error['message']),
    ...stringSignal(error['error']),
  ];
  return collectNestedSignals(error, signals);
}

function collectNestedSignals(error: Record<string, unknown>, signals: string[]): string[] {
  const details = error['details'];
  const cause = error['cause'];
  const nested = [
    ...(details === undefined ? [] : collectErrorSignals(details)),
    ...(cause === undefined ? [] : collectErrorSignals(cause)),
  ];
  return [...signals, ...nested];
}

function stringSignal(value: unknown): string[] {
  return typeof value === 'string' ? [value] : [];
}

function collectOptionalSignals(value: unknown): string[] {
  return value === undefined ? [] : collectErrorSignals(value);
}

function hasQuotaFailureSignal(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes('quota') || lower.includes('rate limit');
}

function hasEmbeddingFailureSignal(message: string): boolean {
  return embeddingFailureSignals.some((signal) => message.includes(signal));
}

function hasDatabaseFailureSignal(message: string): boolean {
  return message.toLowerCase().includes('database');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
