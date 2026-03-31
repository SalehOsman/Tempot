import { describe, it, expect, beforeAll } from 'vitest';
import i18next from 'i18next';
import { i18nConfig } from '../../src/i18n.config.js';

describe('i18n Performance (SC-002)', () => {
  beforeAll(async () => {
    await i18next.init({
      ...i18nConfig,
      resources: {
        ar: { translation: { 'test.key': 'قيمة الاختبار', 'test.interpolated': 'مرحبا {{name}}' } },
        en: { translation: { 'test.key': 'test value', 'test.interpolated': 'hello {{name}}' } },
      },
    });
  });

  it('should retrieve translation in < 1ms (SC-002)', () => {
    const iterations = 1000;
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      i18next.t('test.key', { lng: 'ar' });
    }
    const elapsed = performance.now() - start;
    const avgMs = elapsed / iterations;
    expect(avgMs).toBeLessThan(1);
  });

  it('should handle interpolation in < 1ms (SC-002)', () => {
    const iterations = 1000;
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      i18next.t('test.interpolated', { lng: 'ar', name: 'أحمد' });
    }
    const elapsed = performance.now() - start;
    const avgMs = elapsed / iterations;
    expect(avgMs).toBeLessThan(1);
  });
});
