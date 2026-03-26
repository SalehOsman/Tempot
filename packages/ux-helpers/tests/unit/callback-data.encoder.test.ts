import { describe, it, expect } from 'vitest';
import {
  encodeCallbackData,
  decodeCallbackData,
  encodeWithExpiry,
  decodeWithExpiry,
} from '../../src/callback-data/callback-data.encoder.js';

describe('encodeCallbackData', () => {
  it('should encode parts with colon separator', () => {
    const result = encodeCallbackData(['invoice', 'delete', '42']);
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBe('invoice:delete:42');
  });

  it('should return err for empty parts array', () => {
    const result = encodeCallbackData([]);
    expect(result.isErr()).toBe(true);
  });

  it('should return err when encoded data exceeds 64 bytes', () => {
    const longParts = ['a'.repeat(65)];
    const result = encodeCallbackData(longParts);
    expect(result.isErr()).toBe(true);
  });
});

describe('decodeCallbackData', () => {
  it('should decode colon-separated string into parts', () => {
    const result = decodeCallbackData('invoice:delete:42');
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual(['invoice', 'delete', '42']);
  });

  it('should return err for empty string', () => {
    const result = decodeCallbackData('');
    expect(result.isErr()).toBe(true);
  });
});

describe('encodeWithExpiry', () => {
  it('should append expiry timestamp to encoded data', () => {
    const result = encodeWithExpiry(['invoice', 'confirm'], 5);
    expect(result.isOk()).toBe(true);
    const encoded = result._unsafeUnwrap();
    const parts = encoded.split(':');
    expect(parts).toHaveLength(3);
    expect(parts[0]).toBe('invoice');
    expect(parts[1]).toBe('confirm');
    // Third part should be a Unix timestamp
    const timestamp = parseInt(parts[2]!, 10);
    expect(timestamp).toBeGreaterThan(Date.now() / 1000);
  });

  it('should return err when result exceeds 64 bytes', () => {
    const longPrefix = 'a'.repeat(55);
    const result = encodeWithExpiry([longPrefix], 5);
    expect(result.isErr()).toBe(true);
  });
});

describe('decodeWithExpiry', () => {
  it('should decode parts and expiry timestamp', () => {
    const expiresAt = Math.floor(Date.now() / 1000) + 300;
    const data = `invoice:confirm:${expiresAt}`;
    const result = decodeWithExpiry(data);
    expect(result.isOk()).toBe(true);
    const decoded = result._unsafeUnwrap();
    expect(decoded.parts).toEqual(['invoice', 'confirm']);
    expect(decoded.expiresAt).toBe(expiresAt);
  });

  it('should return err for data with fewer than 2 parts', () => {
    const result = decodeWithExpiry('single');
    expect(result.isErr()).toBe(true);
  });

  it('should return err when expiry is not a valid number', () => {
    const result = decodeWithExpiry('invoice:confirm:notanumber');
    expect(result.isErr()).toBe(true);
  });
});
