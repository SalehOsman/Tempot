interface OllamaEmbeddingInput {
  readonly baseUrl?: string;
  readonly model: string;
  readonly value: string;
}

interface OllamaEmbedResponse {
  readonly embeddings?: unknown;
  readonly embedding?: unknown;
}

const defaultBaseUrl = 'http://localhost:11434';

export async function createOllamaEmbedding(input: OllamaEmbeddingInput): Promise<number[]> {
  const response = await fetch(`${baseUrl(input.baseUrl)}/api/embed`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model: input.model, input: input.value }),
  });
  if (!response.ok) throw new Error(`ai-core.ollama.status_${response.status}`);
  return readEmbedding((await response.json()) as OllamaEmbedResponse);
}

function baseUrl(value: string | undefined): string {
  return (value?.trim() || defaultBaseUrl).replace(/\/+$/u, '');
}

function readEmbedding(response: OllamaEmbedResponse): number[] {
  if (isNumberArray(response.embedding)) return response.embedding;
  if (Array.isArray(response.embeddings) && isNumberArray(response.embeddings[0])) {
    return response.embeddings[0];
  }
  throw new Error('ai-core.ollama.invalid_embedding_response');
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'number');
}
