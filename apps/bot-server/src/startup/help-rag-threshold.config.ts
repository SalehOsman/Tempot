type EnvSource = Record<string, string | undefined>;

const STANDARD_HELP_RAG_CONFIDENCE_THRESHOLD = 0.7;
const LOCAL_HELP_RAG_CONFIDENCE_THRESHOLD = 0.35;
const HELP_RAG_CONFIDENCE_THRESHOLD_KEY = 'TEMPOT_HELP_RAG_CONFIDENCE_THRESHOLD';
const EMBEDDING_PROVIDER_KEY = 'AI_EMBEDDING_PROVIDER';

export function resolveHelpRagConfidenceThreshold(
  env: EnvSource = process.env,
  embeddingProvider = env[EMBEDDING_PROVIDER_KEY],
): number {
  const configured = parseThreshold(env[HELP_RAG_CONFIDENCE_THRESHOLD_KEY]);
  if (configured !== null) return configured;
  return isLocalEmbeddingProvider(embeddingProvider)
    ? LOCAL_HELP_RAG_CONFIDENCE_THRESHOLD
    : STANDARD_HELP_RAG_CONFIDENCE_THRESHOLD;
}

function parseThreshold(value: string | undefined): number | null {
  if (value === undefined) return null;
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed > 0 && parsed <= 1 ? parsed : null;
}

function isLocalEmbeddingProvider(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === 'ollama';
}
