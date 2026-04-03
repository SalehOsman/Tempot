import type { ConversationsStorageAdapter } from '../storage/conversations-storage.adapter.js';
import type { InputEngineLogger } from '../input-engine.contracts.js';

/** Shape of data stored in partial save */
export interface PartialSaveData {
  formData: Record<string, unknown>;
  fieldsCompleted: number;
  completedFieldNames: string[];
}

/** Bundled deps for partial-save operations */
interface PartialSaveDeps {
  storageAdapter: ConversationsStorageAdapter;
  logger: InputEngineLogger;
}

/** Build the storage key for a form's partial save */
export function buildStorageKey(chatId: number, formId: string): string {
  return `ie:form:${String(chatId)}:${formId}`;
}

/** Try to restore partial save. Returns undefined if not found or on error. */
export async function restorePartialSave(
  deps: PartialSaveDeps,
  key: string,
): Promise<PartialSaveData | undefined> {
  const data = await deps.storageAdapter.read(key);
  if (!data || typeof data !== 'object') return undefined;

  const saved = data as PartialSaveData;

  // Basic shape validation
  if (!saved.formData || typeof saved.fieldsCompleted !== 'number') return undefined;
  if (!Array.isArray(saved.completedFieldNames)) return undefined;

  return saved;
}

/** Save field progress after each field completes */
export async function saveFieldProgress(
  deps: PartialSaveDeps,
  key: string,
  data: PartialSaveData,
): Promise<void> {
  await deps.storageAdapter.write(key, data);
}

/** Delete partial save (on completion or user cancel) */
export async function deletePartialSave(deps: PartialSaveDeps, key: string): Promise<void> {
  await deps.storageAdapter.delete(key);
}
