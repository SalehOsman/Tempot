import type { Readable } from 'node:stream';
import { ok, err } from 'neverthrow';
import { type AsyncResult, AppError } from '@tempot/shared';
import type {
  StorageProvider,
  StorageFileUploadedPayload,
  StorageFileDeletedPayload,
} from './storage.contracts.js';
import type { UploadOptions, Attachment } from './storage.types.js';
import type {
  StorageLogger,
  StorageEventBus,
  StorageAttachmentRepo,
  StorageValidation,
  StorageServiceDeps,
  PersistParams,
} from './storage.interfaces.js';
import { STORAGE_ERRORS } from './storage.errors.js';
import { storageToggle } from './storage.toggle.js';

const DEFAULT_SIGNED_URL_EXPIRY_SECONDS = 3600;

export class StorageService {
  private readonly provider: StorageProvider;
  private readonly attachmentRepo: StorageAttachmentRepo;
  private readonly validation: StorageValidation;
  private readonly eventBus: StorageEventBus;
  private readonly logger: StorageLogger;

  constructor(deps: StorageServiceDeps) {
    ({
      provider: this.provider,
      attachmentRepo: this.attachmentRepo,
      validation: this.validation,
      eventBus: this.eventBus,
      logger: this.logger,
    } = deps);
  }

  /** Upload a file: validate -> MIME check -> upload to provider -> create DB record -> emit event */
  async upload(data: Buffer | Readable, options: UploadOptions): AsyncResult<Attachment, AppError> {
    const disabled = storageToggle.check();
    if (disabled) return disabled;

    const validationResult = this.validation.validateUpload(options);
    if (validationResult.isErr()) return err(validationResult.error);
    const { sanitizedName, generatedFileName } = validationResult.value;

    if (Buffer.isBuffer(data)) {
      const mimeResult = await this.validation.validateMimeType(data, options.mimeType);
      if (mimeResult.isErr()) return err(mimeResult.error);
    }

    const providerKey = this.buildProviderKey(options.moduleId, generatedFileName);
    const uploadResult = await this.provider.upload(providerKey, data, options.mimeType);
    if (uploadResult.isErr()) return err(uploadResult.error);

    const createResult = await this.persistAttachment({
      providerResult: uploadResult.value,
      providerKey,
      sanitizedName,
      generatedFileName,
      options,
    });
    if (createResult.isErr()) return err(createResult.error);

    await this.emitEvent(
      'storage.file.uploaded',
      this.buildUploadPayload(createResult.value, options),
    );
    return ok(createResult.value);
  }

  /** Download a file by attachment ID */
  async download(attachmentId: string): AsyncResult<Readable, AppError> {
    const disabled = storageToggle.check();
    if (disabled) return disabled;

    const findResult = await this.attachmentRepo.findById(attachmentId);
    if (findResult.isErr()) return err(findResult.error);
    return this.provider.download(findResult.value.providerKey);
  }

  /** Soft delete an attachment (D6: deferred purge) */
  async delete(attachmentId: string): AsyncResult<void, AppError> {
    const disabled = storageToggle.check();
    if (disabled) return disabled;

    const findResult = await this.attachmentRepo.findById(attachmentId);
    if (findResult.isErr()) return err(findResult.error);
    const attachment = findResult.value;

    const deleteResult = await this.attachmentRepo.delete(attachmentId);
    if (deleteResult.isErr()) return err(deleteResult.error);

    const payload: StorageFileDeletedPayload = {
      attachmentId: attachment.id,
      provider: attachment.provider,
      providerKey: attachment.providerKey,
      deletedBy: attachment.updatedBy ?? undefined,
      permanent: false,
    };
    await this.emitEvent('storage.file.deleted', payload);
    return ok(undefined);
  }

  /** Get a signed/shareable URL for an attachment */
  async getSignedUrl(
    attachmentId: string,
    expiresInSeconds: number = DEFAULT_SIGNED_URL_EXPIRY_SECONDS,
  ): AsyncResult<string, AppError> {
    const disabled = storageToggle.check();
    if (disabled) return disabled;

    const findResult = await this.attachmentRepo.findById(attachmentId);
    if (findResult.isErr()) return err(findResult.error);
    return this.provider.getSignedUrl(findResult.value.providerKey, expiresInSeconds);
  }

  /** Find attachments by module and entity */
  async findByModuleAndEntity(
    moduleId: string,
    entityId: string,
  ): AsyncResult<Attachment[], AppError> {
    const disabled = storageToggle.check();
    if (disabled) return disabled;

    const result = await this.attachmentRepo.findByModuleAndEntity(moduleId, entityId);
    if (result.isErr()) return err(result.error);
    return ok(result.value);
  }

  private buildProviderKey(moduleId: string | undefined, fileName: string): string {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return `${moduleId ?? 'general'}/${yearMonth}/${fileName}`;
  }

  private async persistAttachment(params: PersistParams): AsyncResult<Attachment, AppError> {
    const { providerResult, providerKey, sanitizedName, generatedFileName, options } = params;
    const createResult = await this.attachmentRepo.create({
      fileName: generatedFileName,
      originalName: sanitizedName,
      mimeType: options.mimeType,
      size: options.size,
      provider: this.provider.type,
      providerKey: providerResult.providerKey,
      url: providerResult.url ?? null,
      metadata: options.metadata ?? null,
      moduleId: options.moduleId ?? null,
      entityId: options.entityId ?? null,
      isEncrypted:
        this.provider.type === 's3' ||
        this.provider.type === 'drive' ||
        this.provider.type === 'telegram',
    });

    if (createResult.isErr()) {
      await this.rollbackProviderUpload(providerKey, createResult.error);
      return err(createResult.error);
    }
    return ok(createResult.value);
  }

  private async rollbackProviderUpload(key: string, originalError: AppError): Promise<void> {
    const rollbackResult = await this.provider.delete(key);
    if (rollbackResult.isErr()) {
      this.logger.warn({
        code: STORAGE_ERRORS.ROLLBACK_FAILED,
        providerKey: key,
        provider: this.provider.type,
        originalError: originalError.code,
        rollbackError: rollbackResult.error.code,
      });
    }
  }

  private buildUploadPayload(att: Attachment, opts: UploadOptions): StorageFileUploadedPayload {
    return {
      attachmentId: att.id,
      fileName: att.fileName,
      originalName: att.originalName,
      mimeType: att.mimeType,
      size: att.size,
      provider: att.provider,
      moduleId: opts.moduleId,
      entityId: opts.entityId,
      uploadedBy: att.createdBy ?? undefined,
    };
  }

  private async emitEvent(
    eventName: string,
    payload: StorageFileUploadedPayload | StorageFileDeletedPayload,
  ): Promise<void> {
    const publishResult = await this.eventBus.publish(eventName, payload);
    if (publishResult.isErr()) {
      this.logger.warn({
        code: STORAGE_ERRORS.EVENT_PUBLISH_FAILED,
        event: eventName,
        attachmentId: payload.attachmentId,
        error: publishResult.error.code,
      });
    }
  }
}
