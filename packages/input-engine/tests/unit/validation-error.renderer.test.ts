import { describe, it, expect, vi } from 'vitest';
import type { FieldMetadata } from '../../src/input-engine.types.js';
import {
  renderValidationError,
  type RetryState,
} from '../../src/runner/validation-error.renderer.js';

describe('renderValidationError', () => {
  const baseRetryState: RetryState = { current: 1, max: 3 };

  it('uses custom i18nErrorKey when defined in metadata', () => {
    const metadata: FieldMetadata = {
      fieldType: 'ShortText',
      i18nKey: 'form.name',
      i18nErrorKey: 'custom.error.name',
    };
    const t = vi.fn().mockReturnValue('Custom error message');

    const result = renderValidationError(metadata, baseRetryState, t);

    expect(t).toHaveBeenCalledWith('custom.error.name', { attempt: 1, maxRetries: 3 });
    expect(result).toBe('Custom error message');
  });

  it('uses default error key per field type when no custom key', () => {
    const metadata: FieldMetadata = {
      fieldType: 'Email',
      i18nKey: 'form.email',
    };
    const t = vi.fn().mockReturnValue('Invalid email');

    const result = renderValidationError(metadata, baseRetryState, t);

    expect(t).toHaveBeenCalledWith('input-engine.errors.email', { attempt: 1, maxRetries: 3 });
    expect(result).toBe('Invalid email');
  });

  it('falls back to generic error key when no default for field type', () => {
    const metadata: FieldMetadata = {
      fieldType: 'ConditionalField',
      i18nKey: 'form.conditional',
    };
    const t = vi.fn().mockReturnValue('Generic error');

    const result = renderValidationError(metadata, baseRetryState, t);

    expect(t).toHaveBeenCalledWith('input-engine.errors.generic', { attempt: 1, maxRetries: 3 });
    expect(result).toBe('Generic error');
  });

  it('includes retry count in params (attempt and maxRetries)', () => {
    const metadata: FieldMetadata = {
      fieldType: 'Integer',
      i18nKey: 'form.count',
    };
    const retryState: RetryState = { current: 2, max: 5 };
    const t = vi.fn().mockReturnValue('Error attempt 2/5');

    renderValidationError(metadata, retryState, t);

    expect(t).toHaveBeenCalledWith('input-engine.errors.integer', {
      attempt: 2,
      maxRetries: 5,
    });
  });

  it('returns raw key string when t is undefined', () => {
    const metadata: FieldMetadata = {
      fieldType: 'Phone',
      i18nKey: 'form.phone',
    };

    const result = renderValidationError(metadata, baseRetryState);

    expect(result).toBe('input-engine.errors.phone');
  });

  it('returns raw custom key when t is undefined and custom key is set', () => {
    const metadata: FieldMetadata = {
      fieldType: 'ShortText',
      i18nKey: 'form.name',
      i18nErrorKey: 'my.custom.error',
    };

    const result = renderValidationError(metadata, baseRetryState);

    expect(result).toBe('my.custom.error');
  });

  it('returns generic raw key when t is undefined and field type has no default', () => {
    const metadata: FieldMetadata = {
      fieldType: 'Tags',
      i18nKey: 'form.tags',
    };

    const result = renderValidationError(metadata, baseRetryState);

    expect(result).toBe('input-engine.errors.generic');
  });
});
