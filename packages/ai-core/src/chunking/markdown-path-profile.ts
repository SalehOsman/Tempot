interface CorpusProfile {
  corpusSegment: string;
  sourcePriority: number;
  sourceOfTruth: boolean;
}

const ENGLISH_DOC_ROOTS = new Set([
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

const CORPUS_PROFILES: Readonly<Record<string, CorpusProfile>> = {
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

const UNKNOWN_PROFILE: CorpusProfile = {
  corpusSegment: 'unknown',
  sourcePriority: 0,
  sourceOfTruth: false,
};

export function deriveLanguage(filePath: string): string {
  const segments = normalizedSegments(filePath);
  const localizedSegment = segments.find((segment) => segment === 'ar' || segment === 'en');
  if (localizedSegment) return localizedSegment;

  return ENGLISH_DOC_ROOTS.has(profileRoot(segments)) ? 'en' : 'unknown';
}

export function deriveCorpusProfile(filePath: string): CorpusProfile {
  return CORPUS_PROFILES[profileRoot(normalizedSegments(filePath))] ?? UNKNOWN_PROFILE;
}

function profileRoot(segments: readonly string[]): string {
  const docsIndex = segments.indexOf('docs');
  if (docsIndex >= 0) return docsProfileRoot(segments, docsIndex);
  return segments[0] ?? '';
}

function docsProfileRoot(segments: readonly string[], docsIndex: number): string {
  const next = segments[docsIndex + 1] ?? '';
  if (next === 'product') return localizedProductRoot(segments.slice(docsIndex + 2));
  return next;
}

function localizedProductRoot(segments: readonly string[]): string {
  const locale = segments.find((segment) => segment === 'ar' || segment === 'en');
  return locale ?? 'en';
}

function normalizedSegments(filePath: string): string[] {
  return filePath.replace(/\\/g, '/').split('/').filter(Boolean);
}
