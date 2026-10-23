import * as crypto from 'node:crypto';
import { type Result, err, ok } from 'neverthrow';
import { z } from 'zod';

export const TelegramUserSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  language_code: z.string().optional(),
  is_premium: z.boolean().optional(),
  allows_write_to_pm: z.boolean().optional(),
});
export type TelegramUser = z.infer<typeof TelegramUserSchema>;

export interface TelegramValidatedData {
  readonly user?: TelegramUser;
  readonly authDate: number;
  readonly queryId?: string;
  readonly startParam?: string;
  readonly chatType?: string;
  readonly chatInstance?: string;
}

export type TelegramAuthErrorCode =
  | 'MISSING_HASH'
  | 'INVALID_SIGNATURE'
  | 'MISSING_AUTH_DATE'
  | 'INVALID_AUTH_DATE'
  | 'EXPIRED_INIT_DATA'
  | 'FUTURE_AUTH_DATE'
  | 'INVALID_USER_PAYLOAD';

export class TelegramAuthError extends Error {
  constructor(
    public readonly code: TelegramAuthErrorCode,
    message: string,
  ) {
    super(`[TelegramAuthError:${code}] ${message}`);
    this.name = 'TelegramAuthError';
  }
}

export interface ValidateInitDataOptions {
  /**
   * Maximum allowed age of the signature in seconds.
   * Default: 86,400 seconds (24 hours).
   */
  readonly maxAgeSeconds?: number;

  /**
   * Optional deterministic timestamp injection for tests.
   */
  readonly currentTimeSeconds?: number;
}

/**
 * Validates Telegram Mini App `initData` cryptographically via HMAC-SHA256.
 * Adheres strictly to the Telegram WebApp Authentication Standard:
 * 1. Checks presence of `hash` and `auth_date`.
 * 2. Generates secret_key = HMAC_SHA256("WebAppData", botToken).
 * 3. Builds data-check-string from alphabetically sorted key=value pairs.
 * 4. Compares calculated HMAC with received hash via crypto.timingSafeEqual.
 * 5. Rejects expired signatures (> 24 hours) to prevent replay attacks.
 */
export function validateTelegramInitData(
  rawInitData: string,
  botToken: string,
  options: ValidateInitDataOptions = {},
): Result<TelegramValidatedData, TelegramAuthError> {
  if (!rawInitData || rawInitData.trim().length === 0) {
    return err(new TelegramAuthError('MISSING_HASH', 'Empty initData payload'));
  }

  const query = new URLSearchParams(rawInitData);
  const receivedHash = query.get('hash');
  if (!receivedHash) {
    return err(new TelegramAuthError('MISSING_HASH', 'Missing hash parameter in initData'));
  }

  // 1. Build sorted data-check-string (excluding 'hash')
  const pairs: string[] = [];
  for (const [key, value] of query.entries()) {
    if (key !== 'hash') {
      pairs.push(`${key}=${value}`);
    }
  }
  pairs.sort();
  const dataCheckString = pairs.join('\n');

  // 2. Derive secret key: HMAC_SHA256("WebAppData", botToken)
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();

  // 3. Compute expected hash
  const calculatedHashHex = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  // 4. Timing-safe comparison to prevent side-channel timing attacks
  const calculatedBuffer = Buffer.from(calculatedHashHex, 'hex');
  const receivedBuffer = Buffer.from(receivedHash, 'hex');

  if (
    calculatedBuffer.length !== receivedBuffer.length ||
    !crypto.timingSafeEqual(calculatedBuffer, receivedBuffer)
  ) {
    return err(new TelegramAuthError('INVALID_SIGNATURE', 'Cryptographic HMAC signature mismatch'));
  }

  // 5. Freshness check: verify auth_date against replay attacks
  const authDateStr = query.get('auth_date');
  if (!authDateStr) {
    return err(new TelegramAuthError('MISSING_AUTH_DATE', 'Missing auth_date in initData'));
  }

  const authDate = Number.parseInt(authDateStr, 10);
  if (Number.isNaN(authDate)) {
    return err(new TelegramAuthError('INVALID_AUTH_DATE', 'auth_date is not a valid integer'));
  }

  const now = options.currentTimeSeconds ?? Math.floor(Date.now() / 1000);
  const maxAge = options.maxAgeSeconds ?? 86_400; // 24 hours

  if (now - authDate > maxAge) {
    return err(
      new TelegramAuthError(
        'EXPIRED_INIT_DATA',
        `initData signature has expired (age: ${now - authDate}s > max: ${maxAge}s)`,
      ),
    );
  }

  // Future clock skew tolerance: max 300 seconds (5 minutes)
  if (authDate - now > 300) {
    return err(new TelegramAuthError('FUTURE_AUTH_DATE', 'auth_date is too far in the future'));
  }

  // 6. Parse user payload if present
  let user: TelegramUser | undefined;
  const rawUser = query.get('user');
  if (rawUser) {
    try {
      const parsed = JSON.parse(rawUser);
      const validated = TelegramUserSchema.safeParse(parsed);
      if (!validated.success) {
        return err(
          new TelegramAuthError(
            'INVALID_USER_PAYLOAD',
            `Invalid user schema: ${validated.error.message}`,
          ),
        );
      }
      user = validated.data;
    } catch {
      return err(
        new TelegramAuthError('INVALID_USER_PAYLOAD', 'Failed to parse user JSON payload'),
      );
    }
  }

  return ok({
    user,
    authDate,
    queryId: query.get('query_id') ?? undefined,
    startParam: query.get('start_param') ?? undefined,
    chatType: query.get('chat_type') ?? undefined,
    chatInstance: query.get('chat_instance') ?? undefined,
  });
}
