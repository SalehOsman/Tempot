import { ok, err } from 'neverthrow';
import type { Result } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import type { ConfirmationLevel } from '../ai-core.types.js';
import { AI_ERRORS } from '../ai-core.errors.js';

/** Options for creating a pending confirmation */
export interface CreateConfirmationOptions {
  userId: string;
  toolName: string;
  params: unknown;
  level: ConfirmationLevel;
  summary: string;
  details?: string;
}

/** Options for confirming a pending action */
export interface ConfirmOptions {
  confirmationId: string;
  userId: string;
  code?: string;
}

/** Pending confirmation state */
export interface PendingConfirmation {
  id: string;
  userId: string;
  toolName: string;
  params: unknown;
  level: ConfirmationLevel;
  summary: string;
  details?: string;
  confirmationCode?: string;
  createdAt: Date;
  expiresAt: Date;
}

/** 5-minute TTL for pending confirmations (Rule LXVII) */
const CONFIRMATION_TTL_MS = 5 * 60 * 1000;

export class ConfirmationEngine {
  private readonly pending: Map<string, PendingConfirmation> = new Map();

  /** Create a pending confirmation for a write action */
  createConfirmation(options: CreateConfirmationOptions): Result<PendingConfirmation, AppError> {
    this.cleanExpired();

    const { userId, toolName, params, level, summary, details } = options;
    const id = crypto.randomUUID();
    const now = new Date();
    const confirmation: PendingConfirmation = {
      id,
      userId,
      toolName,
      params,
      level,
      summary,
      details,
      confirmationCode: level === 'escalated' ? this.generateCode() : undefined,
      createdAt: now,
      expiresAt: new Date(now.getTime() + CONFIRMATION_TTL_MS),
    };

    this.pending.set(id, confirmation);
    return ok(confirmation);
  }

  /** Confirm a pending action */
  confirm(options: ConfirmOptions): Result<PendingConfirmation, AppError> {
    this.cleanExpired();

    const { confirmationId, userId, code } = options;
    const pending = this.pending.get(confirmationId);
    if (!pending) return err(new AppError(AI_ERRORS.CONFIRMATION_EXPIRED));
    if (pending.userId !== userId) return err(new AppError(AI_ERRORS.CONFIRMATION_REJECTED));

    // Check expiry
    if (new Date() > pending.expiresAt) {
      this.pending.delete(confirmationId);
      return err(new AppError(AI_ERRORS.CONFIRMATION_EXPIRED));
    }

    // Check escalated code
    if (pending.level === 'escalated') {
      if (!code || code !== pending.confirmationCode) {
        return err(new AppError(AI_ERRORS.CONFIRMATION_CODE_INVALID));
      }
    }

    this.pending.delete(confirmationId);
    return ok(pending);
  }

  /** Cancel a pending confirmation */
  cancel(confirmationId: string, userId: string): Result<void, AppError> {
    const pending = this.pending.get(confirmationId);
    if (!pending) return err(new AppError(AI_ERRORS.CONFIRMATION_EXPIRED));
    if (pending.userId !== userId) return err(new AppError(AI_ERRORS.CONFIRMATION_REJECTED));
    this.pending.delete(confirmationId);
    return ok(undefined);
  }

  /** Generate a 6-digit confirmation code */
  private generateCode(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  /** Clean expired confirmations (lazy cleanup) */
  private cleanExpired(): void {
    const now = new Date();
    for (const [id, pending] of this.pending) {
      if (now > pending.expiresAt) {
        this.pending.delete(id);
      }
    }
  }
}
