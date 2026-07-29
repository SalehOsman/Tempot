import type { AppError } from '@tempot/shared';

const quotaSignals = [
  'quota exceeded',
  'exceeded your current quota',
  'rate limit',
  'embed_content_free_tier_requests',
] as const;

export function classifyHelpAiError(error: AppError): string {
  if (hasQuotaSignal(error)) return 'ai-core.provider.quota_exceeded';
  return error.code;
}

function hasQuotaSignal(value: unknown): boolean {
  const queue: unknown[] = [value];
  const seen = new Set<unknown>();
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || seen.has(current)) continue;
    seen.add(current);
    if (matchesQuotaSignal(current)) return true;
    queue.push(...nestedValues(current));
  }
  return false;
}

function matchesQuotaSignal(value: unknown): boolean {
  if (typeof value === 'string') return includesQuotaSignal(value);
  if (!(value instanceof Error)) return false;
  return includesQuotaSignal(value.message);
}

function includesQuotaSignal(message: string): boolean {
  const normalized = message.toLowerCase();
  return quotaSignals.some((signal) => normalized.includes(signal));
}

function nestedValues(value: unknown): unknown[] {
  if (!isRecord(value)) return [];
  return [value['details'], value['cause'], value['error']].filter(Boolean);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
