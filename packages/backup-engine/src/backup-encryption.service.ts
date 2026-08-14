import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  type DecipherGCM,
} from 'node:crypto';
import { err, ok } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { Result } from '@tempot/shared';
import { BACKUP_ENGINE_ERRORS } from './backup-engine.errors.js';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const KEY_BYTES = 32;

export interface EncryptedPayload {
  readonly algorithm: string;
  readonly iv: string;
  readonly tag: string;
  readonly data: string;
}

export class BackupEncryptionService {
  encrypt(plainText: string, secret: string): Result<string> {
    const keyResult = this.deriveKey(secret);
    if (keyResult.isErr()) return err(keyResult.error);

    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALGORITHM, keyResult.value, iv);
    const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
    const payload: EncryptedPayload = {
      algorithm: ALGORITHM,
      iv: iv.toString('base64'),
      tag: cipher.getAuthTag().toString('base64'),
      data: encrypted.toString('base64'),
    };
    return ok(JSON.stringify(payload));
  }

  decrypt(cipherText: string, secret: string): Result<string> {
    const keyResult = this.deriveKey(secret);
    if (keyResult.isErr()) return err(keyResult.error);

    try {
      const payload = JSON.parse(cipherText) as EncryptedPayload;
      const decipher = createDecipheriv(
        payload.algorithm,
        keyResult.value,
        Buffer.from(payload.iv, 'base64'),
      ) as DecipherGCM;
      decipher.setAuthTag(Buffer.from(payload.tag, 'base64'));
      return ok(
        Buffer.concat([
          decipher.update(Buffer.from(payload.data, 'base64')),
          decipher.final(),
        ]).toString('utf8'),
      );
    } catch (error: unknown) {
      return err(new AppError(BACKUP_ENGINE_ERRORS.ARTIFACT_DECRYPT_FAILED, error));
    }
  }

  private deriveKey(secret: string): Result<Buffer> {
    const trimmed = secret.trim();
    if (trimmed.length === 0) {
      return err(new AppError(BACKUP_ENGINE_ERRORS.INVALID_ENCRYPTION_KEY));
    }
    const base64 = Buffer.from(trimmed, 'base64');
    if (base64.length === KEY_BYTES) return ok(base64);
    return ok(createHash('sha256').update(trimmed).digest());
  }
}
