import { describe, it, expect, vi } from 'vitest';

vi.mock('@tempot/i18n-core', () => ({
  t: (key: string, options?: Record<string, unknown>) => {
    if (options) return `${key}:${JSON.stringify(options)}`;
    return key;
  },
}));

import { createComposer } from '../../src/messages/message.composer.js';

describe('Message Composer', () => {
  it('should compose a single paragraph', () => {
    const result = createComposer().paragraph('hello.world').build();
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBe('hello.world');
  });

  it('should compose multiple paragraphs with double newline spacing', () => {
    const result = createComposer().paragraph('para.one').paragraph('para.two').build();
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBe('para.one\n\npara.two');
  });

  it('should format bullet list with emoji bullets', () => {
    const result = createComposer().bulletList(['Item 1', 'Item 2', 'Item 3']).build();
    expect(result.isOk()).toBe(true);
    const text = result._unsafeUnwrap();
    expect(text).toContain('\u25CF Item 1');
    expect(text).toContain('\u25CF Item 2');
    expect(text).toContain('\u25CF Item 3');
  });

  it('should add visual separator', () => {
    const result = createComposer().paragraph('before').separator().paragraph('after').build();
    expect(result.isOk()).toBe(true);
    const text = result._unsafeUnwrap();
    expect(text).toContain('before');
    expect(text).toContain('after');
    expect(text).toContain('───');
  });

  it('should return err when text exceeds 4096 characters', () => {
    const longKey = 'x'.repeat(4097);
    const result = createComposer().paragraph(longKey).build();
    expect(result.isErr()).toBe(true);
  });

  it('should be chainable (fluent API)', () => {
    const composer = createComposer();
    const result = composer.paragraph('a').paragraph('b').separator().paragraph('c').build();
    expect(result.isOk()).toBe(true);
  });
});
