import { dirname, posix } from 'node:path';

import ts from 'typescript';

export type ImportBoundaryViolationCode =
  | 'MODULE_TO_MODULE_IMPORT'
  | 'PACKAGE_TO_APP_IMPORT'
  | 'PACKAGE_TO_MODULE_IMPORT'
  | 'DEEP_TEMPOT_PACKAGE_IMPORT';

export interface TrackedSourceFile {
  path: string;
  content: string;
}

export interface ImportBoundaryViolation {
  code: ImportBoundaryViolationCode;
  importer: string;
  specifier: string;
}

export interface ImportBoundaryReport {
  checkedFiles: number;
  violations: ImportBoundaryViolation[];
}

interface ComponentRef {
  kind: 'app' | 'module' | 'package' | 'other';
  name: string;
}

export function auditImportBoundaries(files: TrackedSourceFile[]): ImportBoundaryReport {
  const moduleNames = collectModuleNames(files);
  const violations = files.flatMap((file) => auditFile(file, moduleNames));

  return {
    checkedFiles: files.length,
    violations,
  };
}

function auditFile(
  file: TrackedSourceFile,
  moduleNames: ReadonlySet<string>,
): ImportBoundaryViolation[] {
  const importer = normalizePath(file.path);
  const sourceFile = ts.createSourceFile(importer, file.content, ts.ScriptTarget.Latest, true);
  return extractSpecifiers(sourceFile).flatMap((specifier) =>
    classifyViolation(importer, specifier, moduleNames),
  );
}

function extractSpecifiers(sourceFile: ts.SourceFile): string[] {
  const specifiers: string[] = [];

  function visit(node: ts.Node): void {
    if (isImportLikeWithStringSpecifier(node)) {
      specifiers.push(node.moduleSpecifier.text);
    }

    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const [argument] = node.arguments;
      if (argument && ts.isStringLiteral(argument)) {
        specifiers.push(argument.text);
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return specifiers;
}

function isImportLikeWithStringSpecifier(
  node: ts.Node,
): node is (ts.ImportDeclaration | ts.ExportDeclaration) & { moduleSpecifier: ts.StringLiteral } {
  return (
    (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
    node.moduleSpecifier !== undefined &&
    ts.isStringLiteral(node.moduleSpecifier)
  );
}

function classifyViolation(
  importerPath: string,
  specifier: string,
  moduleNames: ReadonlySet<string>,
): ImportBoundaryViolation[] {
  const deepImport = classifyDeepTempotImport(importerPath, specifier);
  if (deepImport !== null) {
    return [deepImport];
  }

  const moduleTarget = resolveTempotModuleTarget(specifier, moduleNames);
  if (moduleTarget !== null) {
    return classifyTargetViolation(importerPath, specifier, moduleTarget);
  }

  const targetPath = resolveRelativeTarget(importerPath, specifier);
  if (targetPath === null) {
    return [];
  }

  return classifyTargetViolation(importerPath, specifier, componentOf(targetPath));
}

function classifyTargetViolation(
  importerPath: string,
  specifier: string,
  target: ComponentRef,
): ImportBoundaryViolation[] {
  const importer = componentOf(importerPath);

  if (importer.kind === 'module' && target.kind === 'module' && importer.name !== target.name) {
    return [violation('MODULE_TO_MODULE_IMPORT', importerPath, specifier)];
  }

  if (importer.kind === 'package' && target.kind === 'app') {
    return [violation('PACKAGE_TO_APP_IMPORT', importerPath, specifier)];
  }

  if (importer.kind === 'package' && target.kind === 'module') {
    return [violation('PACKAGE_TO_MODULE_IMPORT', importerPath, specifier)];
  }

  return [];
}

function classifyDeepTempotImport(
  importer: string,
  specifier: string,
): ImportBoundaryViolation | null {
  if (!/^@tempot\/[^/]+\/(src|dist)\//.test(specifier)) {
    return null;
  }

  return {
    code: 'DEEP_TEMPOT_PACKAGE_IMPORT',
    importer,
    specifier,
  };
}

function violation(
  code: ImportBoundaryViolationCode,
  importer: string,
  specifier: string,
): ImportBoundaryViolation {
  return {
    code,
    importer,
    specifier,
  };
}

function resolveRelativeTarget(importerPath: string, specifier: string): string | null {
  if (!specifier.startsWith('.')) {
    return null;
  }

  return normalizePath(posix.normalize(posix.join(dirname(importerPath), specifier)));
}

function resolveTempotModuleTarget(
  specifier: string,
  moduleNames: ReadonlySet<string>,
): ComponentRef | null {
  const match = /^@tempot\/([^/]+)/.exec(specifier);
  const moduleName = match?.[1];
  if (moduleName === undefined || !moduleNames.has(moduleName)) {
    return null;
  }

  return { kind: 'module', name: moduleName };
}

function collectModuleNames(files: TrackedSourceFile[]): ReadonlySet<string> {
  return new Set(
    files
      .map((file) => /^modules\/([^/]+)/.exec(normalizePath(file.path))?.[1])
      .filter((name): name is string => name !== undefined),
  );
}

function componentOf(path: string): ComponentRef {
  const [kind, name] = path.split('/');
  if ((kind === 'apps' || kind === 'modules' || kind === 'packages') && name !== undefined) {
    return { kind: kind.slice(0, -1) as ComponentRef['kind'], name };
  }

  return { kind: 'other', name: '' };
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\.\//, '');
}
