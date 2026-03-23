import { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';

export interface Session {
  userId: string;
  chatId: string;
  role: 'GUEST' | 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  status: 'ACTIVE' | 'BANNED' | 'PENDING';
  language: string;
  activeConversation: string | null;
  metadata: Record<string, unknown> | null;
  schemaVersion: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISessionProvider {
  getSession(userId: string, chatId: string): Promise<Result<Session, AppError>>;
  saveSession(session: Session): Promise<Result<void, AppError>>;
  deleteSession(userId: string, chatId: string): Promise<Result<void, AppError>>;
  migrateSession?(session: Session): Result<Session, AppError>;
}
