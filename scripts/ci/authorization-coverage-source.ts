import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import type { AuthorizationModuleInput } from './authorization-coverage-audit.js';

export function collectAuthorizationCoverageInputs(cwd: string): AuthorizationModuleInput[] {
  const modulesRoot = join(cwd, 'modules');
  return readdirSync(modulesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => existsSync(join(modulesRoot, entry.name, 'module.config.ts')))
    .map((entry) => collectModuleInput(modulesRoot, entry.name));
}

export function readAuthorizationMatrix(cwd: string): {
  documentedCommands: Set<string>;
  documentedModules: Set<string>;
} {
  const content = readFileSync(join(cwd, 'docs', 'developer', 'authorization-coverage.md'), 'utf8');
  const documentedCommands = new Set(
    [...content.matchAll(/`(\/[a-z_]+)`/g)].map((match) => match[1] ?? ''),
  );
  const documentedModules = new Set(
    [...content.matchAll(/\|\s*([a-z]+(?:-[a-z]+)+)\s*\|/g)].map((match) => match[1] ?? ''),
  );
  return { documentedCommands, documentedModules };
}

export function collectRegisteredCommands(source: string): Map<string, boolean> {
  const file = createSourceFile(source);
  const commands = new Map<string, boolean>();
  visitCalls(file, (call) => {
    if (!isMethodCall(call, 'command')) return;
    const [name, ...middleware] = call.arguments;
    if (!name || !ts.isStringLiteral(name)) return;
    commands.set(
      name.text,
      middleware.some((node) => containsCallNamed(node, 'guard')),
    );
  });
  return commands;
}

export function hasCallNamed(source: string, name: string): boolean {
  let found = false;
  visitCalls(createSourceFile(source), (call) => {
    if (isMethodCall(call, name)) found = true;
  });
  return found;
}

function collectModuleInput(modulesRoot: string, moduleName: string): AuthorizationModuleInput {
  const root = join(modulesRoot, moduleName);
  const flowRoot = join(root, 'flows');
  return {
    moduleName,
    configuredCommands: collectConfiguredCommands(read(join(root, 'module.config.ts'))),
    indexSource: read(join(root, 'index.ts')),
    callbackSource: readOptional(join(root, 'handlers', 'callback.handler.ts')),
    textSource: readOptional(join(root, 'handlers', 'text.handler.ts')),
    conversationSources: existsSync(flowRoot)
      ? readdirSync(flowRoot)
          .filter((fileName) => fileName.endsWith('.flow.ts'))
          .map((fileName) => read(join(flowRoot, fileName)))
      : [],
  };
}

function collectConfiguredCommands(source: string): string[] {
  const commands: string[] = [];
  const file = createSourceFile(source);
  function visit(node: ts.Node): void {
    if (ts.isPropertyAssignment(node) && propertyName(node.name) === 'command') {
      if (ts.isStringLiteral(node.initializer)) commands.push(node.initializer.text);
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  return commands;
}

function containsCallNamed(node: ts.Node, name: string): boolean {
  let found = false;
  function visit(child: ts.Node): void {
    if (ts.isCallExpression(child) && isMethodCall(child, name)) found = true;
    ts.forEachChild(child, visit);
  }
  visit(node);
  return found;
}

function visitCalls(node: ts.Node, visitor: (call: ts.CallExpression) => void): void {
  if (ts.isCallExpression(node)) visitor(node);
  ts.forEachChild(node, (child) => visitCalls(child, visitor));
}

function isMethodCall(call: ts.CallExpression, name: string): boolean {
  return ts.isPropertyAccessExpression(call.expression) && call.expression.name.text === name;
}

function propertyName(name: ts.PropertyName): string | undefined {
  return ts.isIdentifier(name) || ts.isStringLiteral(name) ? name.text : undefined;
}

function createSourceFile(source: string): ts.SourceFile {
  return ts.createSourceFile('authorization.ts', source, ts.ScriptTarget.Latest, true);
}

function read(path: string): string {
  return readFileSync(path, 'utf8');
}

function readOptional(path: string): string {
  return existsSync(path) ? read(path) : '';
}
