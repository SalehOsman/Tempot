import { z } from 'zod';

/** Coerce string to number, pass numbers through */
export const coerceNumber = z.preprocess((val) => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const parsed = Number(val);
    return Number.isNaN(parsed) ? val : parsed;
  }
  return val;
}, z.number());

/** Coerce string to integer, reject floats */
export const coerceInteger = z.preprocess((val) => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const parsed = Number(val);
    if (Number.isNaN(parsed)) return val;
    if (!Number.isInteger(parsed)) return val;
    return parsed;
  }
  return val;
}, z.number().int());

const BOOLEAN_MAP: Record<string, boolean> = {
  true: true,
  false: false,
  '1': true,
  '0': false,
};

/** Coerce string/number to boolean */
export const coerceBoolean = z.preprocess((val) => {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') {
    if (val === 1) return true;
    if (val === 0) return false;
    return val;
  }
  if (typeof val === 'string') {
    const lower = val.toLowerCase();
    if (lower in BOOLEAN_MAP) return BOOLEAN_MAP[lower];
    return val;
  }
  return val;
}, z.boolean());

/** Trim whitespace and collapse multiple spaces */
export const normalizeString = z.preprocess((val) => {
  if (typeof val === 'string') {
    return val.trim().replace(/\s+/g, ' ');
  }
  return val;
}, z.string());

/** Convert ISO string / Unix timestamp / Date to Date */
export const flexibleDate = z.preprocess((val) => {
  if (val instanceof Date) return val;
  if (typeof val === 'string') {
    const date = new Date(val);
    return Number.isNaN(date.getTime()) ? val : date;
  }
  if (typeof val === 'number') return new Date(val);
  return val;
}, z.date());

/** Convert single item or CSV string to array */
export const normalizeArray = z.preprocess((val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string' && val.includes(',')) {
    return val.split(',').map((s) => s.trim());
  }
  if (typeof val === 'string') return [val.trim()];
  return val;
}, z.array(z.unknown()));

/** Namespace export for convenient access */
export const preprocessors = {
  coerceNumber,
  coerceInteger,
  coerceBoolean,
  normalizeString,
  flexibleDate,
  normalizeArray,
} as const;
