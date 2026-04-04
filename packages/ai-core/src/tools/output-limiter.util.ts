/** Build truncation suffix showing actual content chars delivered */
function buildSuffix(shownChars: number, totalChars: number): string {
  return `\n...[truncated — showing ${shownChars}/${totalChars} chars]`;
}

/** Truncate tool output if it exceeds maxChars */
export function truncateToolOutput(output: unknown, maxChars: number): string {
  const str = typeof output === 'string' ? output : JSON.stringify(output);
  if (str.length <= maxChars) {
    return str;
  }

  const totalChars = str.length;

  // Estimate suffix length using maxChars (always >= actual shown count)
  const estimatedSuffix = buildSuffix(maxChars, totalChars);

  // When maxChars is too small to fit even the suffix, just hard-truncate
  if (estimatedSuffix.length >= maxChars) {
    return str.slice(0, maxChars);
  }

  const contentBudget = maxChars - estimatedSuffix.length;
  const suffix = buildSuffix(contentBudget, totalChars);
  return str.slice(0, contentBudget) + suffix;
}
