import { PROTECTED_DATA_ERRORS, type LookupProtectedFieldId } from '@tempot/database';
import { formatNationalId, validateNationalId } from '@tempot/national-id-parser';
import { AppError } from '@tempot/shared';
import { err, ok, type Result } from 'neverthrow';

export function canonicalizeUserLookupValue(
  value: string,
  fieldId: LookupProtectedFieldId,
): Result<string, AppError> {
  if (fieldId === 'email') return ok(value);
  const validation = validateNationalId(value);
  if (validation.isValid) return ok(formatNationalId(value));
  return err(
    new AppError(PROTECTED_DATA_ERRORS.INVALID_LOOKUP_VALUE, {
      fieldId,
      validationErrors: validation.errors,
    }),
  );
}
