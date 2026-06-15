import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

import { collectTrackedSourceFiles } from './tracked-source-files.js';
import type { TrackedSourceFile } from './import-boundary-audit.js';

export type SourceConformanceRule =
  | 'source.suppression'
  | 'source.non_english_comment'
  | 'source.hardcoded_user_text';

export interface SourceConformanceFinding {
  ruleId: SourceConformanceRule;
  file: string;
  line: number;
  evidence: string;
}

const PRODUCTION_SOURCE_PATTERN = /^(?:apps|packages|modules)\/[^/]+\/src\/.*\.tsx?$/;
const SUPPRESSION_PATTERN = /@ts-ignore|@ts-expect-error|eslint-disable/;
const ARABIC_PATTERN = /[\u0621-\u063a\u0641-\u064a]/;

function commentFindings(file: TrackedSourceFile): SourceConformanceFinding[] {
  const findings: SourceConformanceFinding[] = [];
  const scanner = ts.createScanner(
    ts.ScriptTarget.Latest,
    false,
    ts.LanguageVariant.Standard,
    file.content,
  );

  for (let token = scanner.scan(); token !== ts.SyntaxKind.EndOfFileToken; token = scanner.scan()) {
    if (
      token !== ts.SyntaxKind.SingleLineCommentTrivia &&
      token !== ts.SyntaxKind.MultiLineCommentTrivia
    ) {
      continue;
    }

    const text = scanner.getTokenText();
    const line = file.content.slice(0, scanner.getTokenPos()).split(/\r?\n/).length;
    if (SUPPRESSION_PATTERN.test(text)) {
      findings.push({
        ruleId: 'source.suppression',
        file: file.path,
        line,
        evidence: text.trim(),
      });
    }
    if (ARABIC_PATTERN.test(text)) {
      findings.push({
        ruleId: 'source.non_english_comment',
        file: file.path,
        line,
        evidence: text.trim(),
      });
    }
  }

  return findings;
}

function isLiteralText(node: ts.Node | undefined): boolean {
  return Boolean(node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)));
}

function propertyName(node: ts.PropertyAccessExpression): string {
  return node.name.text;
}

function hasHardcodedUserText(node: ts.CallExpression): boolean {
  if (!ts.isPropertyAccessExpression(node.expression)) return false;

  const method = propertyName(node.expression);
  if (method === 'sendMessage') return isLiteralText(node.arguments[1]);
  if (method === 'reply' || method === 'editMessageText') {
    return isLiteralText(node.arguments[0]);
  }
  if (method !== 'answerCallbackQuery') return false;

  const firstArgument = node.arguments[0];
  if (isLiteralText(firstArgument)) return true;
  if (!firstArgument || !ts.isObjectLiteralExpression(firstArgument)) return false;

  return firstArgument.properties.some(
    (property) =>
      ts.isPropertyAssignment(property) &&
      property.name.getText() === 'text' &&
      isLiteralText(property.initializer),
  );
}

function hardcodedTextFindings(file: TrackedSourceFile): SourceConformanceFinding[] {
  const sourceFile = ts.createSourceFile(
    file.path,
    file.content,
    ts.ScriptTarget.Latest,
    true,
    file.path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const findings: SourceConformanceFinding[] = [];

  function visit(node: ts.Node): void {
    if (ts.isCallExpression(node) && hasHardcodedUserText(node)) {
      findings.push({
        ruleId: 'source.hardcoded_user_text',
        file: file.path,
        line: sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1,
        evidence: node.getText(sourceFile),
      });
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return findings;
}

export function auditSourceConformance(
  files: readonly TrackedSourceFile[],
): SourceConformanceFinding[] {
  return files
    .filter((file) => PRODUCTION_SOURCE_PATTERN.test(file.path))
    .flatMap((file) => [...commentFindings(file), ...hardcodedTextFindings(file)])
    .sort(
      (left, right) =>
        left.file.localeCompare(right.file) ||
        left.line - right.line ||
        left.ruleId.localeCompare(right.ruleId),
    );
}

function main(): void {
  const repositoryRoot = path.resolve(process.cwd());
  const findings = auditSourceConformance(collectTrackedSourceFiles(repositoryRoot));

  for (const finding of findings) {
    process.stderr.write(`${finding.file}:${finding.line} ${finding.ruleId} ${finding.evidence}\n`);
  }
  process.stdout.write(`Source conformance: findings=${findings.length}\n`);
  if (findings.length > 0) process.exitCode = 1;
}

const entryPoint = process.argv[1];
if (entryPoint && import.meta.url === pathToFileURL(entryPoint).href) {
  main();
}
