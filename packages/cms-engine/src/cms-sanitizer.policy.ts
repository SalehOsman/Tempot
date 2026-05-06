import sanitizeHtml from 'sanitize-html';
import type { CmsContentFormat } from './cms-engine.types.js';

export function sanitizeCmsValue(value: string, format: CmsContentFormat): string {
  if (format === 'telegram_html') {
    return sanitizeHtml(value, {
      allowedTags: ['a', 'b', 'code', 'em', 'i', 'pre', 's', 'strong', 'u'],
      allowedAttributes: { a: ['href'] },
    });
  }
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });
}
