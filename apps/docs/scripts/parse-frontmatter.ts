/** Minimal YAML frontmatter parser for documentation Markdown files */

/** Parse YAML frontmatter from a Markdown string */
export function parseFrontmatter(markdown: string): Record<string, unknown> | undefined {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(markdown);
  if (!match) return undefined;

  const yamlContent = match[1];
  const result: Record<string, unknown> = {};

  for (const line of yamlContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Handle array items (continuation of previous key)
    if (trimmed.startsWith('- ')) {
      const lastKey = Object.keys(result).at(-1);
      if (lastKey && Array.isArray(result[lastKey])) {
        (result[lastKey] as string[]).push(trimmed.slice(2).trim());
      }
      continue;
    }

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;

    const key = trimmed.slice(0, colonIndex).trim();
    const value = trimmed.slice(colonIndex + 1).trim();

    if (value === '' || value === '[]') {
      result[key] = [];
    } else if (value.startsWith('[') && value.endsWith(']')) {
      result[key] = value
        .slice(1, -1)
        .split(',')
        .map((v) => v.trim().replace(/^['"]|['"]$/g, ''));
    } else {
      result[key] = value.replace(/^['"]|['"]$/g, '');
    }
  }

  return result;
}
