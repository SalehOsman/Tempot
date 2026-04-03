import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import type { FieldHandler, RenderContext } from '../field.handler.js';
import type { FieldMetadata } from '../../input-engine.types.js';
import { INPUT_ENGINE_ERRORS } from '../../input-engine.errors.js';

export class QRCodeFieldHandler implements FieldHandler {
  readonly fieldType = 'QRCode' as const;

  async render(renderCtx: RenderContext, metadata: FieldMetadata): AsyncResult<unknown, AppError> {
    try {
      const ctx = renderCtx.ctx as {
        reply: (text: string, other?: Record<string, unknown>) => Promise<unknown>;
      };
      const conv = renderCtx.conversation as { waitFor: (filter: string) => Promise<unknown> };

      await ctx.reply(metadata.i18nKey);

      const response = await conv.waitFor('message:photo');
      return ok(response);
    } catch {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_RENDER_FAILED, { fieldType: this.fieldType }),
      );
    }
  }

  parseResponse(message: unknown, _metadata: FieldMetadata): Result<unknown, AppError> {
    const msg = message as { text?: string };
    if (!msg.text) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED, {
          fieldType: this.fieldType,
          reason: 'No text in message',
        }),
      );
    }
    return ok(msg.text);
  }

  validate(value: unknown, _schema: unknown, metadata: FieldMetadata): Result<unknown, AppError> {
    const qrData = value as string;

    if (!qrData || qrData.length === 0) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.QR_DECODE_FAILED, {
          fieldType: this.fieldType,
          reason: 'QR data is empty',
        }),
      );
    }

    const format = metadata.expectedFormat ?? 'any';
    return this.validateFormat(qrData, format);
  }

  private validateFormat(
    qrData: string,
    format: 'url' | 'text' | 'json' | 'any',
  ): Result<unknown, AppError> {
    switch (format) {
      case 'url':
        return this.validateUrl(qrData);
      case 'json':
        return this.validateJson(qrData);
      case 'text':
      case 'any':
        return ok(qrData);
    }
  }

  private validateUrl(qrData: string): Result<unknown, AppError> {
    if (!qrData.startsWith('http://') && !qrData.startsWith('https://')) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.QR_FORMAT_MISMATCH, {
          fieldType: this.fieldType,
          reason: 'Value does not start with http:// or https://',
          expectedFormat: 'url',
          value: qrData,
        }),
      );
    }
    return ok(qrData);
  }

  private validateJson(qrData: string): Result<unknown, AppError> {
    try {
      JSON.parse(qrData);
      return ok(qrData);
    } catch {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.QR_FORMAT_MISMATCH, {
          fieldType: this.fieldType,
          reason: 'Value is not valid JSON',
          expectedFormat: 'json',
          value: qrData,
        }),
      );
    }
  }
}
