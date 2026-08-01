const AR_ASK = '\u0627\u0633\u0623\u0644';
const AR_ASK_PLAIN = '\u0627\u0633\u0627\u0644';

const SMART_ASK_PATTERNS = [
  /^\/ask(?:@\S+)?\s*/iu,
  /^ask\/\s*/iu,
  /^ask\s+/iu,
  new RegExp(`^/?(?:${AR_ASK}|${AR_ASK_PLAIN})\\s*`, 'iu'),
];

export function extractHelpQuestion(text: string | undefined): string {
  if (!text) return '';
  const pattern = SMART_ASK_PATTERNS.find((item) => item.test(text));
  return (pattern ? text.replace(pattern, '') : text).trim();
}

export function parseSmartHelpQuestion(text: string | undefined): string | null {
  if (!text) return null;
  const matched = SMART_ASK_PATTERNS.some((pattern) => pattern.test(text));
  if (!matched) return null;
  return extractHelpQuestion(text);
}
