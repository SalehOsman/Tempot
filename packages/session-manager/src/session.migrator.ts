import { Result, ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { Session } from './session.types.js';

/** The latest session schema version; bump this constant when introducing a breaking shape change. */
export const CURRENT_SCHEMA_VERSION = 1;

/**
 * Applies incremental migrations to bring a session up to `CURRENT_SCHEMA_VERSION`.
 * Returns the unchanged session if already current, or an `AppError` for unknown future versions.
 */
export function migrateSession(session: Session): Result<Session, AppError> {
  if (session.schemaVersion === CURRENT_SCHEMA_VERSION) {
    return ok(session);
  }

  if (session.schemaVersion > CURRENT_SCHEMA_VERSION) {
    return err(
      new AppError('session.unknown_schema_version', {
        schemaVersion: session.schemaVersion,
        currentVersion: CURRENT_SCHEMA_VERSION,
      }),
    );
  }

  // Future: add version-by-version migrations here (e.g. v1→v2, v2→v3)
  // For now only v1 exists, so any version below current is unreachable.
  return ok(session);
}
