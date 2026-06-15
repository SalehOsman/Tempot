import { PROTECTED_DATA_ERRORS } from '@tempot/database';
import { formatNationalId, validateNationalId } from '@tempot/national-id-parser';
import { AppError, err, ok, type Result } from '@tempot/shared';

export function canonicalizeNationalId(value: string): Result<string, AppError> {
  const validation = validateNationalId(value);
  if (validation.isValid) return ok(formatNationalId(value));
  return err(
    new AppError(PROTECTED_DATA_ERRORS.INVALID_LOOKUP_VALUE, {
      fieldId: 'nationalId',
      validationErrors: validation.errors,
    }),
  );
}
