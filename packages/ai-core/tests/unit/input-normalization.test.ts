import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  coerceNumber,
  coerceInteger,
  coerceBoolean,
  normalizeString,
  flexibleDate,
  normalizeArray,
  preprocessors,
} from '../../src/tools/input-normalization.js';

describe('coerceNumber', () => {
  it('converts string to number', () => {
    expect(coerceNumber.parse('42')).toBe(42);
  });

  it('passes number through', () => {
    expect(coerceNumber.parse(3.14)).toBe(3.14);
  });

  it('rejects non-numeric string', () => {
    expect(() => coerceNumber.parse('abc')).toThrow();
  });

  it('composes with .pipe() for additional constraints', () => {
    const positive = coerceNumber.pipe(z.number().min(0));
    expect(positive.parse('10')).toBe(10);
    expect(() => positive.parse('-5')).toThrow();
  });
});

describe('coerceInteger', () => {
  it('converts integer string to number', () => {
    expect(coerceInteger.parse('7')).toBe(7);
  });

  it('passes integer through', () => {
    expect(coerceInteger.parse(5)).toBe(5);
  });

  it('rejects float string', () => {
    expect(() => coerceInteger.parse('3.5')).toThrow();
  });

  it('rejects float number', () => {
    expect(() => coerceInteger.parse(3.5)).toThrow();
  });
});

describe('coerceBoolean', () => {
  it('converts "true" to true', () => {
    expect(coerceBoolean.parse('true')).toBe(true);
  });

  it('converts "false" to false', () => {
    expect(coerceBoolean.parse('false')).toBe(false);
  });

  it('converts "1" to true', () => {
    expect(coerceBoolean.parse('1')).toBe(true);
  });

  it('converts "0" to false', () => {
    expect(coerceBoolean.parse('0')).toBe(false);
  });

  it('converts number 1 to true', () => {
    expect(coerceBoolean.parse(1)).toBe(true);
  });

  it('converts number 0 to false', () => {
    expect(coerceBoolean.parse(0)).toBe(false);
  });

  it('passes boolean through', () => {
    expect(coerceBoolean.parse(true)).toBe(true);
    expect(coerceBoolean.parse(false)).toBe(false);
  });

  it('rejects invalid values', () => {
    expect(() => coerceBoolean.parse('yes')).toThrow();
  });

  it('is case-insensitive for string coercion', () => {
    expect(coerceBoolean.parse('TRUE')).toBe(true);
    expect(coerceBoolean.parse('False')).toBe(false);
  });
});

describe('normalizeString', () => {
  it('trims whitespace', () => {
    expect(normalizeString.parse('  hello  ')).toBe('hello');
  });

  it('collapses multiple spaces', () => {
    expect(normalizeString.parse('hello    world')).toBe('hello world');
  });

  it('passes clean string through', () => {
    expect(normalizeString.parse('clean')).toBe('clean');
  });

  it('handles tabs and newlines', () => {
    expect(normalizeString.parse('hello\t\n  world')).toBe('hello world');
  });
});

describe('flexibleDate', () => {
  it('converts ISO string to Date', () => {
    const result = flexibleDate.parse('2026-01-15T00:00:00.000Z');
    expect(result).toBeInstanceOf(Date);
    expect(result.toISOString()).toBe('2026-01-15T00:00:00.000Z');
  });

  it('converts Unix timestamp to Date', () => {
    const timestamp = 1700000000000;
    const result = flexibleDate.parse(timestamp);
    expect(result).toBeInstanceOf(Date);
    expect(result.getTime()).toBe(timestamp);
  });

  it('passes Date through', () => {
    const date = new Date('2026-06-01T00:00:00.000Z');
    const result = flexibleDate.parse(date);
    expect(result).toBeInstanceOf(Date);
    expect(result.getTime()).toBe(date.getTime());
  });

  it('rejects invalid date string', () => {
    expect(() => flexibleDate.parse('not-a-date')).toThrow();
  });
});

describe('normalizeArray', () => {
  it('converts single item to array', () => {
    expect(normalizeArray.parse('hello')).toEqual(['hello']);
  });

  it('splits CSV string', () => {
    expect(normalizeArray.parse('a, b, c')).toEqual(['a', 'b', 'c']);
  });

  it('passes array through', () => {
    expect(normalizeArray.parse(['x', 'y'])).toEqual(['x', 'y']);
  });

  it('trims whitespace in CSV items', () => {
    expect(normalizeArray.parse('  foo ,  bar  ,baz')).toEqual(['foo', 'bar', 'baz']);
  });
});

describe('preprocessors namespace', () => {
  it('exports all 6 preprocessors', () => {
    expect(preprocessors.coerceNumber).toBeDefined();
    expect(preprocessors.coerceInteger).toBeDefined();
    expect(preprocessors.coerceBoolean).toBeDefined();
    expect(preprocessors.normalizeString).toBeDefined();
    expect(preprocessors.flexibleDate).toBeDefined();
    expect(preprocessors.normalizeArray).toBeDefined();
  });

  it('namespace references are identical to named exports', () => {
    expect(preprocessors.coerceNumber).toBe(coerceNumber);
    expect(preprocessors.coerceInteger).toBe(coerceInteger);
    expect(preprocessors.coerceBoolean).toBe(coerceBoolean);
    expect(preprocessors.normalizeString).toBe(normalizeString);
    expect(preprocessors.flexibleDate).toBe(flexibleDate);
    expect(preprocessors.normalizeArray).toBe(normalizeArray);
  });
});
