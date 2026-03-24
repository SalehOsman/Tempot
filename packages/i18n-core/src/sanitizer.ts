import sanitizeHtml from 'sanitize-html';

export function sanitizeValue(value: string): string {
  if (typeof value !== 'string') return value;
  return sanitizeHtml(value, {
    allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    allowedAttributes: {
      a: ['href'],
    },
  });
}
