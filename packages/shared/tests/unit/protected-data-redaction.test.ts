import { describe, expect, it } from 'vitest';
import { redactSensitiveData } from '../../src/security/protected-data-redaction.js';

describe('protected data redaction', () => {
  it('should preserve trace identifiers while redacting PII in arbitrary nested strings', () => {
    const traceId = '550e8400-e29b-41d4-a716-446655440000';
    const referenceCode = 'ERR-20260609-1234';
    const email = 'redaction-canary@example.com';
    const phone = '+201001234567';
    const nationalId = '29801011234567';
    const birthDate = '1998-01-01';
    const result = redactSensitiveData({
      traceId,
      referenceCode,
      arbitrary: {
        deeply: {
          nested: {
            message: `trace=${traceId} ref=${referenceCode} email=${email} phone=${phone}`,
            error: `nationalId=${nationalId} birthDate=${birthDate}`,
          },
        },
      },
    });
    const serialized = JSON.stringify(result);

    expect(serialized).toContain(traceId);
    expect(serialized).toContain(referenceCode);
    expect(serialized).not.toContain(email);
    expect(serialized).not.toContain(phone);
    expect(serialized).not.toContain(nationalId);
    expect(serialized).not.toContain(birthDate);
  });
});
