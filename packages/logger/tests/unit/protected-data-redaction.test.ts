import { describe, expect, it, vi } from 'vitest';
import pino from 'pino';
import type { AuditLogRepository } from '@tempot/database';
import { AppError } from '@tempot/shared';
import { AuditLogger } from '../../src/audit/audit.logger.js';
import { SENSITIVE_KEYS } from '../../src/logger.config.js';
import { appErrorSerializer } from '../../src/technical/error.serializer.js';

describe('protected data logger redaction', () => {
  it('enforces the audit allowlist and preserves only validated change metadata', async () => {
    const repository = {
      create: vi.fn().mockResolvedValue({
        isOk: () => true,
        isErr: () => false,
      }),
    } as unknown as AuditLogRepository;
    const auditLogger = new AuditLogger(repository);
    const changes = [
      {
        fieldId: 'email' as const,
        protected: true as const,
        changeKind: 'changed' as const,
      },
    ];

    const result = await auditLogger.log({
      action: 'users.userProfile.update',
      module: 'users',
      before: {
        language: 'ar',
        email: 'before-audit-canary@example.com',
        unexpected: 'before-unknown-canary',
      },
      after: {
        language: 'en',
        email: 'after-audit-canary@example.com',
        unexpected: 'after-unknown-canary',
      },
      changes,
    });

    expect(result.isOk()).toBe(true);
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        before: {
          language: 'ar',
        },
        after: {
          language: 'en',
          changes,
        },
      }),
    );
    const serialized = JSON.stringify(repository.create.mock.calls);
    expect(serialized).not.toContain('before-audit-canary@example.com');
    expect(serialized).not.toContain('after-audit-canary@example.com');
    expect(serialized).not.toContain('unknown-canary');
  });

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
        first: {
          second: {
            third: {
              fourth: {
                fifth: {
                  sixth: {
                    user: {
                      email: canary,
                      nationalId: '29801011234567',
                      mobileNumber: '+201001234567',
                      birthDate: '1998-01-01',
                    },
                  },
                },
              },
            },
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

  it('preserves trace identifiers while redacting PII from arbitrary logger strings', () => {
    const traceId = '550e8400-e29b-41d4-a716-446655440000';
    const referenceCode = 'ERR-20260609-1234';
    const canary = 'logger-reference-canary@example.com';
    let output = '';
    const logger = pino(
      { redact: SENSITIVE_KEYS },
      { write: (message: string) => (output = message) },
    );

    logger.error(
      {
        traceId,
        referenceCode,
        arbitrary: {
          deeply: {
            nested: {
              error: `ref=${referenceCode} email=${canary} phone=+201001234567`,
            },
          },
        },
      },
      `trace=${traceId} ref=${referenceCode} email=${canary}`,
    );

    expect(output).toContain(traceId);
    expect(output).toContain(referenceCode);
    expect(output).not.toContain(canary);
    expect(output).not.toContain('+201001234567');
  });
});
