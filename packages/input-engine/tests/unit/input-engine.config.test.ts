import { describe, it, expect, afterEach } from 'vitest';
import { isInputEngineEnabled } from '../../src/input-engine.config.js';

describe('isInputEngineEnabled', () => {
  const originalEnv = process.env.TEMPOT_INPUT_ENGINE;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.TEMPOT_INPUT_ENGINE;
    } else {
      process.env.TEMPOT_INPUT_ENGINE = originalEnv;
    }
  });

  it('returns true when env var is not set', () => {
    delete process.env.TEMPOT_INPUT_ENGINE;
    expect(isInputEngineEnabled()).toBe(true);
  });

  it('returns true when env var is "true"', () => {
    process.env.TEMPOT_INPUT_ENGINE = 'true';
    expect(isInputEngineEnabled()).toBe(true);
  });

  it('returns false when env var is "false"', () => {
    process.env.TEMPOT_INPUT_ENGINE = 'false';
    expect(isInputEngineEnabled()).toBe(false);
  });
});
