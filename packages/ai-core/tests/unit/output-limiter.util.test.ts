import { describe, it, expect } from 'vitest';
import { truncateToolOutput } from '../../src/tools/output-limiter.util.js';

describe('truncateToolOutput', () => {
  it('returns output unchanged if under limit', () => {
    const output = 'short output';
    expect(truncateToolOutput(output, 100)).toBe(output);
  });

  it('returns output unchanged if at exact limit', () => {
    const output = 'x'.repeat(100);
    expect(truncateToolOutput(output, 100)).toBe(output);
  });

  it('truncates output exceeding limit with suffix', () => {
    const output = 'x'.repeat(200);
    const result = truncateToolOutput(output, 100);
    expect(result.length).toBeLessThanOrEqual(100);
    expect(result).toContain('...[truncated');
    expect(result).toContain('/200 chars]');
  });

  it('suffix shows correct character counts', () => {
    const output = 'a'.repeat(500);
    const result = truncateToolOutput(output, 150);
    expect(result).toContain('/500 chars]');
    expect(result.length).toBeLessThanOrEqual(150);
  });

  it('handles non-string output by JSON.stringify', () => {
    const output = { key: 'value' };
    const result = truncateToolOutput(output, 5000);
    expect(result).toBe(JSON.stringify(output));
  });

  it('truncates non-string output when stringified exceeds limit', () => {
    const output = { data: 'x'.repeat(500) };
    const result = truncateToolOutput(output, 100);
    expect(result.length).toBeLessThanOrEqual(100);
    expect(result).toContain('...[truncated');
  });

  it('handles empty string', () => {
    expect(truncateToolOutput('', 100)).toBe('');
  });

  it('handles limit smaller than suffix length gracefully', () => {
    const output = 'x'.repeat(100);
    const result = truncateToolOutput(output, 10);
    expect(result.length).toBeLessThanOrEqual(10);
  });
});
