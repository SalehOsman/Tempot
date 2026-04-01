import { describe, it, expect, vi } from 'vitest';

vi.mock('@tempot/i18n-core', () => ({
  t: (key: string) => key,
}));

import { formatLoading, formatSuccess } from '../../src/messages/status.formatter.js';
import {
  encodeCallbackData,
  decodeCallbackData,
} from '../../src/callback-data/callback-data.encoder.js';
import { validateLabel } from '../../src/keyboards/label.validator.js';

describe('Performance', () => {
  it('formatLoading() (NFR-001: < 1ms)', () => {
    const iterations = 1000;
    const options = { key: 'invoice.processing' };

    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      formatLoading(options);
    }
    const elapsed = performance.now() - start;
    const avgMs = elapsed / iterations;

    expect(avgMs).toBeLessThan(1);
  });

  it('formatSuccess() (NFR-001: < 1ms)', () => {
    const iterations = 1000;
    const options = { key: 'invoice.created' };

    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      formatSuccess(options);
    }
    const elapsed = performance.now() - start;
    const avgMs = elapsed / iterations;

    expect(avgMs).toBeLessThan(1);
  });

  it('encodeCallbackData() (NFR-001: < 1ms)', () => {
    const iterations = 1000;
    const parts = ['invoice', 'delete', '42'] as const;

    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      encodeCallbackData(parts);
    }
    const elapsed = performance.now() - start;
    const avgMs = elapsed / iterations;

    expect(avgMs).toBeLessThan(1);
  });

  it('decodeCallbackData() (NFR-001: < 1ms)', () => {
    const iterations = 1000;
    const data = 'invoice:delete:42';

    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      decodeCallbackData(data);
    }
    const elapsed = performance.now() - start;
    const avgMs = elapsed / iterations;

    expect(avgMs).toBeLessThan(1);
  });

  it('validateLabel() (NFR-001: < 1ms)', () => {
    const iterations = 1000;
    const label = '\u2705 \u0625\u0646\u0634\u0627\u0621';

    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      validateLabel(label, 'inline');
    }
    const elapsed = performance.now() - start;
    const avgMs = elapsed / iterations;

    expect(avgMs).toBeLessThan(1);
  });
});
