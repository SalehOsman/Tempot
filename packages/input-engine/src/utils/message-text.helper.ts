function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : undefined;
}

function readText(source: Record<string, unknown>, key: string): string | undefined {
  const message = asRecord(source[key]);
  const text = message?.['text'];
  return typeof text === 'string' ? text : undefined;
}

/** Extract message text from raw Telegram updates or grammY Context objects. */
export function extractMessageText(response: unknown): string | undefined {
  const msg = asRecord(response);
  if (!msg) return undefined;

  const directText = msg['text'];
  if (typeof directText === 'string') return directText;

  const contextText = readText(msg, 'message') ?? readText(msg, 'msg');
  if (contextText) return contextText;

  const update = asRecord(msg['update']);
  return update ? readText(update, 'message') : undefined;
}
