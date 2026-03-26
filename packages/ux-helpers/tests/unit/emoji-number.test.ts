import { describe, it, expect } from 'vitest';
import { toEmojiNumber } from '../../src/lists/emoji-number.js';

describe('toEmojiNumber', () => {
  it('should return emoji for 1', () => {
    expect(toEmojiNumber(1)).toBe('1\uFE0F\u20E3');
  });

  it('should return emoji for 10', () => {
    expect(toEmojiNumber(10)).toBe('\uD83D\uDD1F');
  });

  it('should return text fallback for 11', () => {
    expect(toEmojiNumber(11)).toBe('11.');
  });

  it('should return text fallback for 0', () => {
    expect(toEmojiNumber(0)).toBe('0.');
  });

  it('should return text fallback for negative', () => {
    expect(toEmojiNumber(-1)).toBe('-1.');
  });
});
