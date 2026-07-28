import fs from 'node:fs/promises';
import path from 'node:path';

export async function discoverMarkdownFiles(rootPath: string): Promise<string[]> {
  const entries = await fs.readdir(rootPath, { withFileTypes: true });
  const discovered = await Promise.all(entries.map((entry) => discoverEntry(rootPath, entry)));
  return discovered.flat().sort();
}

export async function readKnowledgeTextFile(filePath: string): Promise<string> {
  return fs.readFile(filePath, 'utf8');
}

async function discoverEntry(rootPath: string, entry: import('node:fs').Dirent): Promise<string[]> {
  const fullPath = path.join(rootPath, entry.name);
  if (entry.isDirectory()) return nestedMarkdownFiles(fullPath, entry.name);
  if (entry.isFile() && entry.name.endsWith('.md')) return [entry.name];
  return [];
}

async function nestedMarkdownFiles(fullPath: string, entryName: string): Promise<string[]> {
  const nested = await discoverMarkdownFiles(fullPath);
  return nested.map((item) => `${entryName}/${item}`);
}
