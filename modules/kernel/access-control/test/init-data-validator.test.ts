import * as crypto from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { validateTelegramInitData } from '../src/telegram/init-data-validator.js';

describe('Telegram initData HMAC-SHA256 Cryptographic Validator', () => {
  const BOT_TOKEN = '123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ';

  function signTelegramData(params: Record<string, string>, botToken: string): string {
    const pairs: string[] = [];
    for (const [key, value] of Object.entries(params)) {
      pairs.push(`${key}=${value}`);
    }
    pairs.sort();
    const dataCheckString = pairs.join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    const searchParams = new URLSearchParams(params);
    searchParams.set('hash', hash);
    return searchParams.toString();
  }

  it('validates authentic Telegram initData payload with user object', () => {
    const now = 1700000000;
    const user = {
      id: 99887766,
      first_name: 'Ahmed',
      last_name: 'Ali',
      username: 'ahmed_ali',
      language_code: 'ar',
    };

    const raw = signTelegramData(
      {
        auth_date: String(now),
        query_id: 'AAHdF6IQAAAAAN0XohD9',
        user: JSON.stringify(user),
      },
      BOT_TOKEN,
    );

    const result = validateTelegramInitData(raw, BOT_TOKEN, {
      currentTimeSeconds: now + 60, // 1 minute later
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.user?.id).toBe(99887766);
      expect(result.value.user?.first_name).toBe('Ahmed');
      expect(result.value.queryId).toBe('AAHdF6IQAAAAAN0XohD9');
      expect(result.value.authDate).toBe(now);
    }
  });

  it('rejects payload when hash is missing', () => {
    const raw = 'auth_date=1700000000&query_id=123';
    const result = validateTelegramInitData(raw, BOT_TOKEN);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe('MISSING_HASH');
    }
  });

  it('rejects payload when signature is tampered with', () => {
    const now = 1700000000;
    const raw = signTelegramData(
      {
        auth_date: String(now),
        query_id: 'AAHdF6IQAAAAAN0XohD9',
      },
      BOT_TOKEN,
    );

    // Tamper with query_id
    const tampered = raw.replace('AAHdF6IQAAAAAN0XohD9', 'TAMPERED_ID');
    const result = validateTelegramInitData(tampered, BOT_TOKEN, {
      currentTimeSeconds: now,
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe('INVALID_SIGNATURE');
    }
  });

  it('rejects expired initData older than 24 hours (Replay Attack defense)', () => {
    const authDate = 1700000000;
    const now = authDate + 86401; // 24 hours + 1 second later

    const raw = signTelegramData(
      {
        auth_date: String(authDate),
      },
      BOT_TOKEN,
    );

    const result = validateTelegramInitData(raw, BOT_TOKEN, {
      currentTimeSeconds: now,
      maxAgeSeconds: 86400,
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe('EXPIRED_INIT_DATA');
    }
  });

  it('rejects future auth_date with drift > 300s', () => {
    const now = 1700000000;
    const futureAuthDate = now + 400; // 400 seconds in future

    const raw = signTelegramData(
      {
        auth_date: String(futureAuthDate),
      },
      BOT_TOKEN,
    );

    const result = validateTelegramInitData(raw, BOT_TOKEN, {
      currentTimeSeconds: now,
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe('FUTURE_AUTH_DATE');
    }
  });

  it('rejects malformed user json string', () => {
    const now = 1700000000;
    const raw = signTelegramData(
      {
        auth_date: String(now),
        user: '{ invalid json',
      },
      BOT_TOKEN,
    );

    const result = validateTelegramInitData(raw, BOT_TOKEN, {
      currentTimeSeconds: now,
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe('INVALID_USER_PAYLOAD');
    }
  });
});
