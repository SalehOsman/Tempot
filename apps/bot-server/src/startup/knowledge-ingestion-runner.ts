import path from 'node:path';
import type { ContentChunk } from '@tempot/ai-core';
import type { KnowledgeIngestionSummary } from '../module-providers.types.js';
import type { KnowledgeProviderDeps } from './knowledge-provider.deps.js';
import { toSafeKnowledgeRoot, type InternalKnowledgeProfile } from './knowledge-source-profiles.js';

type MutableSummary = {
  -readonly [Key in keyof KnowledgeIngestionSummary]: KnowledgeIngestionSummary[Key];
};

interface ScanContext {
  readonly deps: KnowledgeProviderDeps;
  readonly selected: InternalKnowledgeProfile;
  readonly write: boolean;
  readonly summary: MutableSummary;
}

export async function scanKnowledgeProfile(
  deps: KnowledgeProviderDeps,
  selected: InternalKnowledgeProfile,
  write: boolean,
): Promise<KnowledgeIngestionSummary> {
  const summary = emptySummary(selected.id, write ? 'write' : 'dry-run');
  for (const root of selected.roots)
    await scanRootIfMounted({ deps, selected, write, summary }, root);
  return summary;
}

async function scanRootIfMounted(context: ScanContext, root: string): Promise<void> {
  const rootPath = toSafeKnowledgeRoot(root);
  if (!(await context.deps.pathExists(rootPath))) {
    context.summary.skipped += 1;
    return;
  }
  await scanRoot(context, root, rootPath);
}

async function scanRoot(context: ScanContext, root: string, rootPath: string): Promise<void> {
  const files = await context.deps.discoverMarkdownFiles(rootPath);
  for (const file of files) await scanFile({ context, root, rootPath, file });
}

async function scanFile(input: {
  readonly context: ScanContext;
  readonly root: string;
  readonly rootPath: string;
  readonly file: string;
}): Promise<void> {
  const content = await input.context.deps.readTextFile(path.join(input.rootPath, input.file));
  const sourceId = `${input.root}/${input.file}`.replace(/\\/g, '/');
  const chunks = await input.context.deps.chunkMarkdown(content, sourceId);
  if (chunks.isErr()) {
    input.context.summary.failed += 1;
    return;
  }
  input.context.summary.processed += 1;
  input.context.summary.chunks += chunks.value.length;
  if (input.context.write) await ingestChunks(input.context, sourceId, chunks.value);
}

async function ingestChunks(
  context: ScanContext,
  sourceId: string,
  chunks: readonly ContentChunk[],
): Promise<void> {
  for (const chunk of chunks) {
    await context.deps.ingestContent({
      contentId: `knowledge:${context.selected.id}:${sourceId}:${chunk.chunkIndex}`,
      contentType: context.selected.contentType,
      content: chunk.text,
      metadata: toKnowledgeMetadata(context.selected, chunk.metadata),
    });
  }
}

function toKnowledgeMetadata(
  selected: InternalKnowledgeProfile,
  metadata: ContentChunk['metadata'],
): ContentChunk['metadata'] {
  return {
    ...metadata,
    sourceProfile: selected.id,
    sourcePriority: readNumber(metadata['sourcePriority']) ?? selected.sourcePriority,
    sourceOfTruth: readBoolean(metadata['sourceOfTruth']) ?? selected.sourceOfTruth,
    languagePolicy: selected.languagePolicy,
  };
}

function readNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function readBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function emptySummary(profileId: string, mode: KnowledgeIngestionSummary['mode']): MutableSummary {
  return {
    jobId: crypto.randomUUID(),
    profileId,
    mode,
    status: 'succeeded',
    processed: 0,
    skipped: 0,
    failed: 0,
    chunks: 0,
    hashesWritten: mode !== 'dry-run',
  };
}
