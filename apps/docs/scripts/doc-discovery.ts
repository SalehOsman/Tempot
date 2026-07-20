import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const ENGLISH_PRODUCT_ROOTS = new Set([
  'README.md',
  'ai-context',
  'architecture',
  'development',
  'governance',
  'modules',
  'operations',
  'packages',
  'reference',
  'start-here',
]);

export type DocCorpusSegment =
  | 'localized-product'
  | 'source-of-truth'
  | 'package-docs'
  | 'generated-reference'
  | 'unknown';

export interface DocCorpusProfile {
  corpusSegment: DocCorpusSegment;
  sourcePriority: number;
  sourceOfTruth: boolean;
}

const CORPUS_PROFILES: Readonly<Record<string, DocCorpusProfile>> = {
  ar: { corpusSegment: 'localized-product', sourcePriority: 70, sourceOfTruth: false },
  en: { corpusSegment: 'localized-product', sourcePriority: 70, sourceOfTruth: false },
  governance: { corpusSegment: 'source-of-truth', sourcePriority: 100, sourceOfTruth: true },
  architecture: { corpusSegment: 'source-of-truth', sourcePriority: 95, sourceOfTruth: true },
  'ai-context': { corpusSegment: 'source-of-truth', sourcePriority: 90, sourceOfTruth: true },
  'start-here': { corpusSegment: 'source-of-truth', sourcePriority: 85, sourceOfTruth: true },
  development: { corpusSegment: 'source-of-truth', sourcePriority: 80, sourceOfTruth: true },
  operations: { corpusSegment: 'source-of-truth', sourcePriority: 80, sourceOfTruth: true },
  modules: { corpusSegment: 'package-docs', sourcePriority: 75, sourceOfTruth: false },
  packages: { corpusSegment: 'package-docs', sourcePriority: 75, sourceOfTruth: false },
  reference: { corpusSegment: 'generated-reference', sourcePriority: 20, sourceOfTruth: false },
};

export function discoverMarkdownFilesSync(baseDir: string, relativeDir = ''): string[] {
  const absoluteDir = relativeDir ? resolve(baseDir, relativeDir) : baseDir;
  const files: string[] = [];

  for (const entry of readdirSync(absoluteDir, { withFileTypes: true })) {
    const relativePath = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...discoverMarkdownFilesSync(baseDir, relativePath));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(relativePath);
    }
  }

  return files.sort((left, right) => (left < right ? -1 : left > right ? 1 : 0));
}

export function deriveLanguageFromDocPath(filePath: string): string {
  const first = filePath.replace(/\\/g, '/').split('/')[0];
  if (first === 'ar' || first === 'en') return first;
  return ENGLISH_PRODUCT_ROOTS.has(first) ? 'en' : 'unknown';
}

export function deriveCorpusProfileFromDocPath(filePath: string): DocCorpusProfile {
  const first = filePath.replace(/\\/g, '/').split('/')[0];
  return (
    CORPUS_PROFILES[first] ?? {
      corpusSegment: 'unknown',
      sourcePriority: 0,
      sourceOfTruth: false,
    }
  );
}
