import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { formatHumanResult, sortViolations, type Violation } from './lib/audit-result.js';
import { runAudit } from './lib/audit-runner.js';

interface TelegramKeyboardUxInput {
  repositoryRoot: string;
  files?: readonly string[];
}

interface LocalePair {
  ar: Record<string, unknown>;
  en: Record<string, unknown>;
}

interface LocaleCheckInput {
  file: string;
  source: string;
  index: number;
  key: string;
  locale: 'ar' | 'en';
  data: Record<string, unknown>;
  maxLength: number;
}

interface ViolationInput {
  file: string;
  source: string;
  index: number;
  message: string;
}

const excludedSegments = new Set(['node_modules', 'dist', 'coverage', '.git']);
const buttonPattern = /\.text\(\s*i18n\.t\(\s*['"]([^'"]+)['"]/g;
const rowPattern = /\.row\(\)/g;
const keyboardPattern = /new InlineKeyboard\(\)/g;

export function auditTelegramKeyboardUx(input: TelegramKeyboardUxInput): Violation[] {
  return sortViolations(collectMenuFiles(input).flatMap((file) => auditMenuFile(input, file)));
}

function auditMenuFile(input: TelegramKeyboardUxInput, absoluteFile: string): Violation[] {
  const relativeFile = normalizePath(path.relative(input.repositoryRoot, absoluteFile));
  const source = readFileSync(absoluteFile, 'utf8');
  const locales = loadLocales(input.repositoryRoot, relativeFile);
  return [
    ...rowViolations(source, relativeFile),
    ...labelViolations(source, relativeFile, locales),
  ];
}

function rowViolations(source: string, file: string): Violation[] {
  const tokens = keyboardTokens(source);
  let rowButtons = 0;
  const violations: Violation[] = [];
  for (const token of tokens) {
    if (token.kind !== 'button') {
      rowButtons = 0;
      continue;
    }
    rowButtons += 1;
    if (rowButtons === 4) {
      violations.push(
        violation({
          file,
          source,
          index: token.index,
          message: 'Inline keyboard row has more than 3 buttons.',
        }),
      );
    }
  }
  return violations;
}

function labelViolations(source: string, file: string, locales: LocalePair): Violation[] {
  return [...source.matchAll(buttonPattern)].flatMap((match) => {
    const key = match[1] ?? '';
    const index = match.index ?? 0;
    return [
      ...localeKeyViolations({
        file,
        source,
        index,
        key,
        locale: 'ar',
        data: locales.ar,
        maxLength: 20,
      }),
      ...localeKeyViolations({
        file,
        source,
        index,
        key,
        locale: 'en',
        data: locales.en,
        maxLength: 24,
      }),
    ];
  });
}

function localeKeyViolations(input: LocaleCheckInput): Violation[] {
  const label = resolveLocaleValue(input.data, input.key);
  if (typeof label !== 'string') {
    return [violation(missingLocaleViolation(input))];
  }
  if (visibleLength(label) > input.maxLength) {
    const message =
      input.locale === 'ar'
        ? 'Arabic button label exceeds 20 characters.'
        : 'English button label exceeds 24 characters.';
    return [violation({ file: input.file, source: input.source, index: input.index, message })];
  }
  return [];
}

function keyboardTokens(source: string): { kind: 'button' | 'keyboard' | 'row'; index: number }[] {
  return [
    ...[...source.matchAll(keyboardPattern)].map((match) => ({
      kind: 'keyboard' as const,
      index: match.index ?? 0,
    })),
    ...[...source.matchAll(buttonPattern)].map((match) => ({
      kind: 'button' as const,
      index: match.index ?? 0,
    })),
    ...[...source.matchAll(rowPattern)].map((match) => ({
      kind: 'row' as const,
      index: match.index ?? 0,
    })),
  ].sort((left, right) => left.index - right.index);
}

function loadLocales(repositoryRoot: string, relativeFile: string): LocalePair {
  const moduleName = relativeFile.split('/')[1] ?? '';
  const localeRoot = path.join(repositoryRoot, 'modules', moduleName, 'locales');
  return {
    ar: readJson(path.join(localeRoot, 'ar.json')),
    en: readJson(path.join(localeRoot, 'en.json')),
  };
}

function collectMenuFiles(input: TelegramKeyboardUxInput): string[] {
  const files =
    input.files
      ?.map((file) => path.join(input.repositoryRoot, file))
      .filter((file) => existsSync(file)) ??
    collectFiles(path.join(input.repositoryRoot, 'modules'));
  return files.filter((file) => /menus[\\/].+\.ts$/.test(file));
}

function collectFiles(root: string): string[] {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    if (excludedSegments.has(entry.name)) return [];
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) return collectFiles(fullPath);
    return entry.isFile() ? [fullPath] : [];
  });
}

function readJson(file: string): Record<string, unknown> {
  if (!existsSync(file)) return {};
  return JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
}

function resolveLocaleValue(data: Record<string, unknown>, key: string): unknown {
  return key.split('.').reduce<unknown>((current, segment) => {
    if (typeof current !== 'object' || current === null) return undefined;
    return (current as Record<string, unknown>)[segment];
  }, data);
}

function violation(input: ViolationInput): Violation {
  const location = locationForIndex(input.source, input.index);
  return {
    rule: 'Rule LXVI',
    file: input.file,
    line: location.line,
    column: location.column,
    excerpt: lineAt(input.source, location.line).trim(),
    message: input.message,
  };
}

function locationForIndex(source: string, index: number): { line: number; column: number } {
  const lines = source.slice(0, index).split(/\r?\n/);
  return { line: lines.length, column: (lines.at(-1)?.length ?? 0) + 1 };
}

function lineAt(source: string, line: number): string {
  return source.split(/\r?\n/)[line - 1] ?? '';
}

function visibleLength(label: string): number {
  return [...label.replace(/\p{Emoji_Presentation}/gu, '').trim()].length;
}

function normalizePath(value: string): string {
  return value.replaceAll(path.sep, '/');
}

function missingLocaleViolation(input: LocaleCheckInput): ViolationInput {
  return {
    file: input.file,
    source: input.source,
    index: input.index,
    message: `Button locale key is missing in ${input.locale} locale.`,
  };
}

async function main(): Promise<void> {
  const repositoryRoot = path.resolve(process.cwd());
  const run = await runAudit('telegram-keyboard-ux', () =>
    auditTelegramKeyboardUx({ repositoryRoot }),
  );
  process.stdout.write(formatHumanResult(run.result));
  process.exitCode = run.exitCode;
}

const entryPoint = process.argv[1];
if (entryPoint && import.meta.url === pathToFileURL(entryPoint).href) {
  await main();
}
