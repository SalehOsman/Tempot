import { ok, err, type Result } from 'neverthrow';
import { AppError, type AsyncResult } from '@tempot/shared';
import type { StorageEngineClient, InputEngineLogger } from '../../input-engine.contracts.js';
import { INPUT_ENGINE_ERRORS } from '../../input-engine.errors.js';

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

/** Download file from Telegram via conversation.external (D21) */
async function downloadFromTelegram(
  params: Pick<UploadParams, 'fileId' | 'conversation' | 'ctx' | 'logger'>,
): Promise<Result<Buffer, AppError>> {
  const { fileId, conversation, ctx, logger } = params;

  let fileInfo: TelegramFileInfo;
  try {
    fileInfo = (await conversation.external(() => ctx.api.getFile(fileId))) as TelegramFileInfo;
  } catch (error: unknown) {
    const reason = error instanceof Error ? error.message : 'unknown';
    logger.warn({ msg: 'Failed to get file info from Telegram', fileId, error: reason });
    return err(new AppError(INPUT_ENGINE_ERRORS.MEDIA_UPLOAD_FAILED, { fileId, reason }));
  }

  if (!fileInfo.file_path) {
    logger.warn({ msg: 'Telegram getFile returned no file_path', fileId });
    const reason = 'no file_path';
    return err(new AppError(INPUT_ENGINE_ERRORS.MEDIA_UPLOAD_FAILED, { fileId, reason }));
  }

  try {
    const buffer = (await conversation.external(() =>
      ctx.api.file.download(fileInfo.file_path as string),
    )) as Buffer;
    return ok(buffer);
  } catch (error: unknown) {
    const reason = error instanceof Error ? error.message : 'unknown';
    logger.warn({ msg: 'Failed to download file from Telegram', fileId, error: reason });
    return err(new AppError(INPUT_ENGINE_ERRORS.MEDIA_UPLOAD_FAILED, { fileId, reason }));
  }
}

/** Build the minimal fallback result with only telegramFileId */
function buildFallback(fileId: string): StorageUploadResult {
  return { telegramFileId: fileId };
}

/** Upload file buffer to storage client via conversation.external (D21) */
async function uploadBuffer(
  params: Pick<UploadParams, 'storageClient' | 'fileName' | 'mimeType' | 'conversation'>,
  buffer: Buffer,
): AsyncResult<string, AppError> {
  const { storageClient, fileName, mimeType, conversation } = params;
  // D21: wrap storage upload in conversation.external to prevent replay
  return (await conversation.external(async () =>
    storageClient.upload(buffer, {
      filename: fileName ?? 'unnamed',
      mimeType: mimeType ?? 'application/octet-stream',
    }),
  )) as Result<string, AppError>;
}

/** Upload a file to storage after downloading from Telegram */
export async function uploadToStorage(
  params: UploadParams,
): AsyncResult<StorageUploadResult, AppError> {
  const { fileId, fileName, mimeType, fileSize, logger } = params;

  const downloadResult = await downloadFromTelegram(params);

  if (downloadResult.isErr()) {
    return ok(buildFallback(fileId));
  }

  const uploadResult = await uploadBuffer(params, downloadResult.value);

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
