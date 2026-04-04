import { ok } from 'neverthrow';
import { type AppError, type AsyncResult } from '@tempot/shared';
import type { StorageEngineClient, InputEngineLogger } from '../../input-engine.contracts.js';

/** Result of a successful storage upload */
export interface StorageUploadResult {
  telegramFileId: string;
  storageUrl?: string;
  fileName?: string;
  mimeType?: string;
  size?: number;
}

/** Minimal file info from Telegram getFile response */
interface TelegramFileInfo {
  file_path?: string;
}

/** Parameters for uploadToStorage */
export interface UploadParams {
  fileId: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  conversation: { external: (fn: () => Promise<unknown>) => Promise<unknown> };
  ctx: {
    api: {
      getFile: (fileId: string) => Promise<TelegramFileInfo>;
      file: { download: (filePath: string) => Promise<Buffer> };
    };
  };
  storageClient: StorageEngineClient;
  logger: InputEngineLogger;
}

/** Download file from Telegram via conversation.external */
async function downloadFromTelegram(
  params: Pick<UploadParams, 'fileId' | 'conversation' | 'ctx' | 'logger'>,
): Promise<Buffer | undefined> {
  const { fileId, conversation, ctx, logger } = params;

  const fileInfo = (await conversation.external(() => ctx.api.getFile(fileId))) as TelegramFileInfo;

  if (!fileInfo.file_path) {
    logger.warn({ msg: 'Telegram getFile returned no file_path', fileId });
    return undefined;
  }

  return (await conversation.external(() =>
    ctx.api.file.download(fileInfo.file_path as string),
  )) as Buffer;
}

/** Build the minimal fallback result with only telegramFileId */
function buildFallback(fileId: string): StorageUploadResult {
  return { telegramFileId: fileId };
}

/** Upload file buffer to storage client */
async function uploadBuffer(
  params: Pick<UploadParams, 'storageClient' | 'fileName' | 'mimeType'>,
  buffer: Buffer,
): AsyncResult<string, AppError> {
  const { storageClient, fileName, mimeType } = params;
  return storageClient.upload(buffer, {
    filename: fileName ?? 'unnamed',
    mimeType: mimeType ?? 'application/octet-stream',
  });
}

/** Upload a file to storage after downloading from Telegram */
export async function uploadToStorage(
  params: UploadParams,
): AsyncResult<StorageUploadResult, AppError> {
  const { fileId, fileName, mimeType, fileSize, logger } = params;

  let buffer: Buffer | undefined;
  try {
    buffer = await downloadFromTelegram(params);
  } catch (error: unknown) {
    const reason = error instanceof Error ? error.message : 'unknown';
    logger.warn({
      msg: 'Failed to download file from Telegram',
      fileId,
      error: reason,
    });
    return ok(buildFallback(fileId));
  }

  if (!buffer) {
    return ok(buildFallback(fileId));
  }

  const uploadResult = await uploadBuffer(params, buffer);

  if (uploadResult.isErr()) {
    logger.warn({
      msg: 'Storage upload failed, degrading gracefully',
      fileId,
      error: uploadResult.error.code,
    });
    return ok(buildFallback(fileId));
  }

  return ok({
    telegramFileId: fileId,
    storageUrl: uploadResult.value,
    fileName,
    mimeType,
    size: fileSize,
  });
}
