/** Truncation suffix template */
function buildSuffix(maxChars: number, totalChars: number): string {
  return `\n...[truncated — showing ${maxChars}/${totalChars} chars]`;
}

/** Truncate tool output if it exceeds maxChars */
export function truncateToolOutput(output: unknown, maxChars: number): string {
  const str = typeof output === 'string' ? output : JSON.stringify(output);
  if (str.length <= maxChars) {
    return str;
  }

  const totalChars = str.length;
  const suffix = buildSuffix(maxChars, totalChars);

  // When maxChars is too small to fit even the suffix, just hard-truncate
  if (suffix.length >= maxChars) {
    return str.slice(0, maxChars);
  }

  const contentBudget = maxChars - suffix.length;
  return str.slice(0, contentBudget) + suffix;
}
