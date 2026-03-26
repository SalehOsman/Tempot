import { describe, it, expect } from 'vitest';
import { sanitizeValue } from '../../src/sanitizer.js';

describe('sanitizeValue', () => {
  it('should strip script tags completely', () => {
    const result = sanitizeValue('<script>alert("xss")</script>Hello');
    expect(result).toBe('Hello');
  });

  it('should preserve allowed formatting tags', () => {
    const result = sanitizeValue('<b>Bold</b> and <i>italic</i>');
    expect(result).toBe('<b>Bold</b> and <i>italic</i>');
  });

  it('should preserve em and strong tags', () => {
    const result = sanitizeValue('<em>emphasis</em> <strong>strong</strong>');
    expect(result).toBe('<em>emphasis</em> <strong>strong</strong>');
  });

  it('should preserve anchor tags with href attribute', () => {
    const result = sanitizeValue('<a href="https://example.com">link</a>');
    expect(result).toBe('<a href="https://example.com">link</a>');
  });

  it('should strip disallowed attributes from anchor tags', () => {
    const result = sanitizeValue('<a href="https://example.com" onclick="alert(1)">link</a>');
    expect(result).toBe('<a href="https://example.com">link</a>');
  });

  it('should preserve p and br tags', () => {
    const result = sanitizeValue('<p>Paragraph</p><br>');
    expect(result).toBe('<p>Paragraph</p><br />');
  });

  it('should strip div and span tags', () => {
    const result = sanitizeValue('<div>content</div><span>inline</span>');
    expect(result).toBe('contentinline');
  });

  it('should strip img tags to prevent image injection', () => {
    const result = sanitizeValue('<img src="https://evil.com/track.png" onerror="alert(1)">');
    expect(result).toBe('');
  });

  it('should handle plain text without modification', () => {
    const result = sanitizeValue('Hello, World!');
    expect(result).toBe('Hello, World!');
  });

  it('should handle empty string', () => {
    const result = sanitizeValue('');
    expect(result).toBe('');
  });
});
