import type { Context, NextFunction } from 'grammy';
import sanitizeHtml from 'sanitize-html';

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [],
  allowedAttributes: {},
};

/**
 * Creates sanitizer middleware that strips HTML tags from message text and caption.
 * Modifies ctx.update.message directly since the raw update object is mutable.
 */
export function createSanitizerMiddleware(): (ctx: Context, next: NextFunction) => Promise<void> {
  return async (ctx: Context, next: NextFunction): Promise<void> => {
    const msg = ctx.update?.message;
    if (msg) {
      if (typeof msg.text === 'string') {
        (msg as { text: string }).text = sanitizeHtml(msg.text, SANITIZE_OPTIONS);
      }
      if (typeof msg.caption === 'string') {
        (msg as { caption: string }).caption = sanitizeHtml(msg.caption, SANITIZE_OPTIONS);
      }
    }
    await next();
  };
}
