import { ok, err } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import { chunkMarkdown } from '@tempot/ai-core';
import {
  computeContentHash,
  deriveLanguage,
  extractFrontmatter,
  ingestFile,
  shouldSkipFile,
} from './ingest-docs.js';
import type {
  DocsIngestionRuntime,
  DocsIngestionRunnerDeps,
  IngestCliArgs,
  ProcessFilesResult,
} from './docs.types.js';
import { deriveCorpusProfileFromDocPath } from './doc-discovery.js';

interface IngestionState {
  processed: number;
  skipped: number;
  failed: number;
  hashes: Record<string, string>;
}

interface FileIngestionInput {
  file: string;
  content: string;
  hash: string;
}

interface RunnerContext {
  deps: DocsIngestionRunnerDeps;
  state: IngestionState;
}

async function createDefaultRuntime(): ReturnType<
  NonNullable<DocsIngestionRunnerDeps['createRuntime']>
> {
  const runtime = await import('./ingest-runtime.js');
  return runtime.createDocsIngestionRuntime();
}

async function loadRuntime(
  args: IngestCliArgs,
  deps: DocsIngestionRunnerDeps,
): AsyncResult<DocsIngestionRuntime | undefined, AppError> {
  if (!args.write) return ok(undefined);
  const runtimeResult = await (deps.createRuntime ?? createDefaultRuntime)();
  if (runtimeResult.isErr()) return err(runtimeResult.error);
  return ok(runtimeResult.value);
}

async function previewChunkCount(filePath: string, content: string): AsyncResult<number, AppError> {
  const chunkResult = chunkMarkdown(content, { filePath });
  if (chunkResult.isErr()) {
    return err(new AppError('DOCS.CHUNK_FAILED', { filePath }));
  }
  return ok(chunkResult.value.length);
}

async function readContent(
  file: string,
  deps: DocsIngestionRunnerDeps,
  state: IngestionState,
): Promise<string | undefined> {
  try {
    return await deps.readFileContent(file);
  } catch (error: unknown) {
    state.failed++;
    deps.log({ level: 'error', msg: 'file-read-failed', file, details: String(error) });
    return undefined;
  }
}

async function handleDryRun(input: FileIngestionInput, context: RunnerContext): Promise<void> {
  const fm = extractFrontmatter(input.content);
  const chunkCount = await previewChunkCount(input.file, input.content);
  if (chunkCount.isErr()) {
    context.state.failed++;
    context.deps.log({
      level: 'error',
      msg: 'chunk-preview-failed',
      file: input.file,
      code: chunkCount.error.code,
    });
    return;
  }
  const corpusProfile = deriveCorpusProfileFromDocPath(input.file);
  context.deps.log({
    level: 'info',
    msg: 'dry-run',
    file: input.file,
    language: deriveLanguage(input.file),
    corpusSegment: corpusProfile.corpusSegment,
    sourcePriority: corpusProfile.sourcePriority,
    sourceOfTruth: corpusProfile.sourceOfTruth,
    package: (fm?.['package'] as string | undefined) ?? null,
    contentType: 'developer-docs',
    hash: input.hash,
    chunkCount: chunkCount.value,
  });
  context.state.processed++;
}

async function handleWrite(
  input: FileIngestionInput,
  runtime: DocsIngestionRuntime,
  context: RunnerContext,
): Promise<void> {
  const ingestionResult = await ingestFile(input.file, input.content, runtime);
  if (ingestionResult.isErr()) {
    context.state.failed++;
    context.deps.log({
      level: 'error',
      msg: 'ingestion-failed',
      file: input.file,
      code: ingestionResult.error.code,
      details: ingestionResult.error.details,
    });
    return;
  }
  context.state.hashes[input.file] = input.hash;
  context.state.processed++;
}

function buildResult(args: IngestCliArgs, state: IngestionState): ProcessFilesResult {
  return {
    processed: state.processed,
    skipped: state.skipped,
    failed: state.failed,
    hashes: state.hashes,
    hashesWritten: args.write,
  };
}

function filterFilesByPath(files: string[], path: string | undefined): string[] {
  if (!path) return files;
  const normalizedPath = path.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
  return files.filter((file) => {
    const normalizedFile = file.replace(/\\/g, '/');
    return normalizedFile === normalizedPath || normalizedFile.startsWith(`${normalizedPath}/`);
  });
}

export async function runDocsIngestion(
  args: IngestCliArgs,
  deps: DocsIngestionRunnerDeps,
): AsyncResult<ProcessFilesResult, AppError> {
  if (args.write && args.dryRun) {
    return err(new AppError('DOCS.ARGUMENT_CONFLICT', { flags: ['--write', '--dry-run'] }));
  }
  const filesResult = await deps.discoverFiles();
  if (filesResult.isErr()) return err(filesResult.error);
  const files = filterFilesByPath(filesResult.value, args.path);
  const existingHashes = args.full ? {} : await deps.loadHashes();
  const state = { processed: 0, skipped: 0, failed: 0, hashes: { ...existingHashes } };
  const runtime = await loadRuntime(args, deps);
  if (runtime.isErr()) return err(runtime.error);
  for (const file of files) {
    const content = await readContent(file, deps, state);
    if (content === undefined) continue;
    const hash = computeContentHash(content);
    if (!args.full && shouldSkipFile(file, hash, existingHashes)) {
      state.skipped++;
      continue;
    }
    const input = { file, content, hash };
    const context = { deps, state };
    if (args.dryRun) await handleDryRun(input, context);
    else if (runtime.value) await handleWrite(input, runtime.value, context);
  }
  if (runtime.value) await runtime.value.close();
  if (args.write) await deps.saveHashes(state.hashes);
  const result = buildResult(args, state);
  if (state.failed > 0) return err(new AppError('DOCS.INGESTION_PARTIAL_FAILURE', result));
  return ok(result);
}
