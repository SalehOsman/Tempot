import { describe, expect, it } from 'vitest';
import pino from 'pino';
import { AppError } from '@tempot/shared';
import { SENSITIVE_KEYS } from '../../src/logger.config.js';
import { appErrorSerializer } from '../../src/technical/error.serializer.js';

describe('protected data logger redaction', () => {
  it('redacts protected aliases recursively from Pino output and AppError details', () => {
    const canary = 'logger-canary@example.com';
    let output = '';
    const logger = pino(
      {
        redact: SENSITIVE_KEYS,
        serializers: { err: appErrorSerializer },
      },
      { write: (message: string) => (output = message) },
    );

    logger.error(
      {
        request: {
          user: {
            email: canary,
            nationalId: '29801011234567',
            mobileNumber: '+201001234567',
            birthDate: '1998-01-01',
          },
        },
        err: new AppError('database.protection.failed', {
          profile: { emailAddress: canary },
        }),
      },
      'protected data failure',
    );

    expect(output).not.toContain(canary);
    expect(output).not.toContain('29801011234567');
    expect(output).not.toContain('+201001234567');
    expect(output).not.toContain('1998-01-01');
  });
});
