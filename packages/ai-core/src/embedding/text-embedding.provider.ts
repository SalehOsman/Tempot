import { embed } from 'ai';
import type { AIConfig } from '../ai-core.types.js';
import type { AIRegistry } from '../ai-core.contracts.js';
import { getModelId } from '../provider/ai-provider.factory.js';
import { createOllamaEmbedding } from './ollama-embedding.client.js';

export async function createTextEmbedding(input: {
  readonly config: AIConfig;
  readonly registry: AIRegistry;
  readonly value: string;
}): Promise<number[]> {
  if (input.config.embeddingProvider === 'ollama') {
    return createOllamaEmbedding({
      baseUrl: input.config.embeddingBaseUrl,
      model: input.config.embeddingModel,
      value: input.value,
    });
  }
  const { embedding } = await embed({
    model: input.registry.textEmbeddingModel(getModelId(input.config, 'embedding')),
    value: input.value,
  });
  return embedding;
}
