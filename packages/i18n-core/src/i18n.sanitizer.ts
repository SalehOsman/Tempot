import sanitizeHtml from 'sanitize-html';

/**
 * Sanitizes a translation value by stripping dangerous HTML tags.
 *
 * Allows a safe subset of formatting tags (`<b>`, `<i>`, `<em>`, `<strong>`,
 * `<a>`, `<p>`, `<br>`) while removing script injections and other
 * potentially harmful content.
 *
 * @param value - The raw string to sanitize
 * @returns Sanitized string with only safe HTML tags retained
 *
 * @example
 * ```typescript
 * sanitizeValue('<script>alert("xss")</script>Hello'); // 'Hello'
 * sanitizeValue('<b>Bold</b>');                         // '<b>Bold</b>'
 * ```
 */
export function sanitizeValue(value: string): string {
  if (typeof value !== 'string') return value;
  return sanitizeHtml(value, {
    allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    allowedAttributes: {
      a: ['href'],
    },
  });
}
