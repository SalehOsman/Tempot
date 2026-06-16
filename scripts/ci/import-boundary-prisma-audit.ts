import ts from 'typescript';
import type { ImportBoundaryViolation } from './import-boundary-audit.js';

export function auditDirectPrismaModelAccess(
  importer: string,
  sourceFile: ts.SourceFile,
): ImportBoundaryViolation[] {
  if (!isGovernedApplicationLayer(importer)) return [];

  const prismaNames = collectDatabasePrismaImports(sourceFile);
  if (prismaNames.size === 0) return [];

  const violations: ImportBoundaryViolation[] = [];

  function visit(node: ts.Node): void {
    if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression)) {
      const owner = node.expression.text;
      const property = node.name.text;
      if (prismaNames.has(owner) && !property.startsWith('$')) {
        violations.push({
          code: 'DIRECT_PRISMA_MODEL_ACCESS',
          importer,
          specifier: `${owner}.${property}`,
        });
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return violations;
}

function collectDatabasePrismaImports(sourceFile: ts.SourceFile): ReadonlySet<string> {
  const names = new Set<string>();

  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    if (!ts.isStringLiteral(statement.moduleSpecifier)) continue;
    if (statement.moduleSpecifier.text !== '@tempot/database') continue;

    const namedBindings = statement.importClause?.namedBindings;
    if (!namedBindings || !ts.isNamedImports(namedBindings)) continue;

    for (const element of namedBindings.elements) {
      const importedName = element.propertyName?.text ?? element.name.text;
      if (importedName === 'prisma') names.add(element.name.text);
    }
  }

  return names;
}

function isGovernedApplicationLayer(path: string): boolean {
  if (path.includes('/tests/') || path.includes('/database/migrations/')) return false;
  return /^(?:apps|modules)\//.test(path);
}
