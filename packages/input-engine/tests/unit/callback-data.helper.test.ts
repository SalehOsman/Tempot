import { describe, it, expect } from 'vitest';
import {
  encodeFormCallback,
  decodeFormCallback,
  generateFormId,
} from '../../src/utils/callback-data.helper.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';

describe('callback-data.utils', () => {
  describe('encodeFormCallback', () => {
    it('returns correctly formatted callback string', () => {
      const result = encodeFormCallback('abc12345', 2, 'opt_1');
      expect(result).toBe('ie:abc12345:2:opt_1');
    });

    it('handles values containing colons', () => {
      const result = encodeFormCallback('form1', 0, 'val:with:colons');
      expect(result).toBe('ie:form1:0:val:with:colons');
    });
  });

  describe('decodeFormCallback', () => {
    it('decodes valid callback data', () => {
      const result = decodeFormCallback('ie:form1:2:opt_1');
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual({
        formId: 'form1',
        fieldIndex: 2,
        value: 'opt_1',
      });
    });

    it('decodes value containing colons', () => {
      const result = decodeFormCallback('ie:form1:2:value:with:colons');
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual({
        formId: 'form1',
        fieldIndex: 2,
        value: 'value:with:colons',
      });
    });

    it('returns err for invalid prefix', () => {
      const result = decodeFormCallback('xx:form1:2:opt_1');
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED);
    });

    it('returns err for missing segments', () => {
      const result = decodeFormCallback('ie:form1:2');
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED);
    });

    it('returns err for non-numeric fieldIndex', () => {
      const result = decodeFormCallback('ie:form1:abc:opt_1');
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED);
    });
  });

  describe('generateFormId', () => {
    it('returns an 8-character string', () => {
      const id = generateFormId();
      expect(typeof id).toBe('string');
      expect(id).toHaveLength(8);
    });

    it('returns unique values on successive calls', () => {
      const id1 = generateFormId();
      const id2 = generateFormId();
      expect(id1).not.toBe(id2);
    });
  });
});
