import { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';

/**
 * Represents a user's session scoped to a specific chat.
 *
 * `schemaVersion` tracks breaking shape changes deployed across bot versions;
 * `version` is an OCC counter incremented automatically on every write.
 */
export interface Session {
  userId: string;
  chatId: string;
  role: 'GUEST' | 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  status: 'ACTIVE' | 'BANNED' | 'PENDING';
  language: string;
  activeConversation: string | null;
  metadata: Record<string, unknown> | null;
  /** Incremented manually when the session shape changes in a breaking way. */
  schemaVersion: number;
  /** Incremented automatically on every `saveSession` call for optimistic concurrency. */
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Contract for reading, writing, and deleting sessions across storage layers. */
export interface ISessionProvider {
  /** Retrieves the session for the given userId + chatId composite key. */
  getSession(userId: string, chatId: string): Promise<Result<Session, AppError>>;

  /** Persists the session, incrementing the OCC version before writing. */
  saveSession(session: Session): Promise<Result<void, AppError>>;

  /** Removes the session from all storage layers. */
  deleteSession(userId: string, chatId: string): Promise<Result<void, AppError>>;

  /** Applies incremental schema migrations when `session.schemaVersion` is behind. */
  migrateSession(session: Session): Result<Session, AppError>;
}
