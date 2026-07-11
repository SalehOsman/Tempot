import { describe, expect, it } from 'vitest';
import { scanTypeScriptTokens } from '../../lib/ts-token-scanner.js';

describe('scanTypeScriptTokens', () => {
  it('classifies strings, templates, and comments in source order', () => {
    const source = [
      "const plain = 'hello';",
      'const double = "world";',
      'const template = `value ${plain}`;',
      '// line comment',
      '/* block comment */',
    ].join('\n');

    const spans = scanTypeScriptTokens(source).map((span) => ({
      kind: span.kind,
      text: source.slice(span.start, span.end),
    }));

    expect(spans).toEqual([
      { kind: 'string', text: "'hello'" },
      { kind: 'string', text: '"world"' },
      { kind: 'template', text: '`value ${plain}`' },
      { kind: 'lineComment', text: '// line comment' },
      { kind: 'blockComment', text: '/* block comment */' },
    ]);
  });

  it('keeps escaped quotes inside a string span', () => {
    const source = String.raw`const value = 'it\'s fine';`;
    const [span] = scanTypeScriptTokens(source);

    expect(source.slice(span.start, span.end)).toBe(String.raw`'it\'s fine'`);
    expect(span.kind).toBe('string');
  });
});
