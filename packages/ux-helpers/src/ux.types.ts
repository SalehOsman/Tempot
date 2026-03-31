import type { InlineKeyboard } from 'grammy';
import type { Result, AsyncResult, AppError } from '@tempot/shared';

// --- Status Types ---
export type StatusType = 'loading' | 'success' | 'error' | 'warning';

export interface StatusFormatOptions {
  readonly key: string;
  readonly interpolation?: Record<string, unknown>;
}

export interface StatusSendOptions extends StatusFormatOptions {
  readonly keyboard?: InlineKeyboard;
}

// --- Error Types ---
export type ErrorType = 'user' | 'system' | 'permission' | 'session_expired';

export interface UserErrorOptions {
  readonly problemKey: string;
  readonly solutionKey: string;
  readonly interpolation?: Record<string, unknown>;
}

export interface SystemErrorOptions {
  readonly referenceCode: string;
}

export interface PermissionErrorOptions {
  readonly reasonKey: string;
}

export interface SessionExpiredOptions {
  readonly restartCallbackData: string;
}

export interface SessionExpiredResult {
  readonly text: string;
  readonly restartButton: InlineButtonConfig;
}

// --- Button Types ---
export type KeyboardType = 'inline' | 'reply';
export type DetectedLanguage = 'ar' | 'en';

export interface InlineButtonConfig {
  readonly label: string;
  readonly callbackData: string;
}

export interface CharacterLimits {
  readonly inline: { readonly ar: 20; readonly en: 24 };
  readonly reply: { readonly ar: 15; readonly en: 18 };
}

export interface RowLimits {
  readonly inline: 3;
  readonly reply: 2;
}

// --- Confirmation Types ---
export interface ConfirmationOptions {
  readonly actionNameKey: string;
  readonly cancelKey?: string;
  readonly callbackPrefix: string;
  readonly isIrreversible?: boolean;
}

export interface ConfirmationResult {
  readonly keyboard: InlineKeyboard;
  readonly warningText?: string;
}

// --- List Types ---
export interface ListFormatOptions<T> {
  readonly titleKey: string;
  readonly items: readonly T[];
  readonly renderItem: (item: T, index: number) => string;
  readonly emptyStateKey?: string;
  readonly emptyActionConfig?: InlineButtonConfig;
}

export interface ListFormatResult {
  readonly text: string;
  readonly emptyActionButton?: InlineButtonConfig;
}

export interface PaginationOptions {
  readonly currentPage: number;
  readonly totalPages: number;
  readonly callbackPrefix: string;
}

// --- Feedback Types ---
export interface FeedbackOptions<T> {
  readonly loadingKey: string;
  readonly action: () => AsyncResult<T, AppError>;
  readonly successKey: string;
  readonly keyboard?: InlineKeyboard;
}

// --- Callback Data Types ---
export type CallbackSeparator = ':';

export interface DecodedCallbackWithExpiry {
  readonly parts: readonly string[];
  readonly expiresAt: number;
}

// --- Message Composer Types ---
export interface ComposerBuilder {
  paragraph(key: string, interpolation?: Record<string, unknown>): ComposerBuilder;
  bulletList(items: readonly string[]): ComposerBuilder;
  separator(): ComposerBuilder;
  build(): Result<string, AppError>;
}

// --- Golden Rule Fallback Types ---
export interface EditOrSendOptions {
  readonly text: string;
  readonly parseMode?: 'HTML' | 'MarkdownV2';
  readonly replyMarkup?: InlineKeyboard;
}

// --- Answer Callback Query Types ---
export interface AnswerCallbackOptions {
  readonly text?: string;
  readonly showAlert?: boolean;
}

// --- Mock Context Types (Testing) ---
export interface MockContextOptions {
  readonly chatId?: number;
  readonly messageId?: number;
  readonly callbackData?: string;
  readonly userId?: number;
}

export interface MockContextCalls {
  readonly editMessageText: unknown[][];
  readonly reply: unknown[][];
  readonly answerCallbackQuery: unknown[][];
  readonly replyWithChatAction: unknown[][];
}
