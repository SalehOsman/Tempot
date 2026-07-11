export type TypeScriptTokenKind = 'string' | 'template' | 'lineComment' | 'blockComment';

export interface TypeScriptTokenSpan {
  kind: TypeScriptTokenKind;
  start: number;
  end: number;
}

export function scanTypeScriptTokens(source: string): TypeScriptTokenSpan[] {
  const spans: TypeScriptTokenSpan[] = [];
  let index = 0;

  while (index < source.length) {
    const current = source[index];
    const next = source[index + 1];

    if (current === "'" || current === '"') {
      const end = scanQuoted(source, index, current);
      spans.push({ kind: 'string', start: index, end });
      index = end;
    } else if (current === '`') {
      const end = scanQuoted(source, index, '`');
      spans.push({ kind: 'template', start: index, end });
      index = end;
    } else if (current === '/' && next === '/') {
      const end = scanLineComment(source, index);
      spans.push({ kind: 'lineComment', start: index, end });
      index = end;
    } else if (current === '/' && next === '*') {
      const end = scanBlockComment(source, index);
      spans.push({ kind: 'blockComment', start: index, end });
      index = end;
    } else {
      index += 1;
    }
  }

  return spans;
}

function scanQuoted(source: string, start: number, quote: string): number {
  let index = start + 1;
  while (index < source.length) {
    if (source[index] === '\\') {
      index += 2;
    } else if (source[index] === quote) {
      return index + 1;
    } else {
      index += 1;
    }
  }
  return source.length;
}

function scanLineComment(source: string, start: number): number {
  const newline = source.indexOf('\n', start);
  return newline === -1 ? source.length : newline;
}

function scanBlockComment(source: string, start: number): number {
  const close = source.indexOf('*/', start + 2);
  return close === -1 ? source.length : close + 2;
}
