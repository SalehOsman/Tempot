import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { AIContentType } from '@tempot/ai-core';
import type { ModuleLogger } from '../bot-server.types.js';
import type { InternalKnowledgeProfile } from './knowledge-source-profiles.js';

interface CustomProfileRecord {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly root: string;
}

const profileFile =
  process.env['TEMPOT_KNOWLEDGE_CUSTOM_PROFILES_FILE'] ??
  '/app/data/knowledge-custom-profiles.json';

export async function loadCustomKnowledgeProfiles(
  logger: Pick<ModuleLogger, 'warn'>,
): Promise<InternalKnowledgeProfile[]> {
  try {
    const raw = await readFile(profileFile, 'utf8');
    return parseRecords(raw).map(toInternalProfile);
  } catch (error) {
    if (isMissingFile(error)) return [];
    logger.warn({ msg: 'knowledge_custom_profiles_load_failed', error: safeError(error) });
    return [];
  }
}

export async function saveCustomKnowledgeProfiles(
  profiles: readonly InternalKnowledgeProfile[],
): Promise<void> {
  const records = profiles.filter((item) => item.custom).map(toRecord);
  await mkdir(path.dirname(profileFile), { recursive: true });
  await writeFile(profileFile, `${JSON.stringify(records, null, 2)}\n`, 'utf8');
}

export function toCustomProfile(input: {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly root: string;
}): InternalKnowledgeProfile {
  return {
    id: input.id,
    labelKey: 'knowledge-management.source.custom',
    displayName: input.name,
    description: input.description,
    roots: [input.root],
    contentType: 'developer-docs' as AIContentType,
    languagePolicy: 'mixed',
    sourcePriority: 65,
    sourceOfTruth: false,
    custom: true,
  };
}

function parseRecords(raw: string): CustomProfileRecord[] {
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(isCustomRecord);
}

function isCustomRecord(value: unknown): value is CustomProfileRecord {
  if (!isRecord(value)) return false;
  return ['id', 'name', 'description', 'root'].every((key) => typeof value[key] === 'string');
}

function toInternalProfile(record: CustomProfileRecord): InternalKnowledgeProfile {
  return toCustomProfile({
    id: record.id,
    name: record.name,
    description: record.description,
    root: record.root,
  });
}

function toRecord(profile: InternalKnowledgeProfile): CustomProfileRecord {
  return {
    id: profile.id,
    name: profile.displayName ?? profile.id,
    description: profile.description ?? '',
    root: profile.roots[0] ?? '',
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isMissingFile(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

function safeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
