import {
  collectAuthorizationCoverageInputs,
  collectRegisteredCommands,
  hasCallNamed,
  readAuthorizationMatrix,
} from './authorization-coverage-source.js';

export {
  collectAuthorizationCoverageInputs,
  readAuthorizationMatrix,
} from './authorization-coverage-source.js';

export type AuthorizationCoverageViolationCode =
  | 'UNREGISTERED_COMMAND'
  | 'UNGUARDED_COMMAND'
  | 'MISSING_MATRIX_ENTRY'
  | 'UNENFORCED_CALLBACK'
  | 'UNENFORCED_TEXT'
  | 'UNENFORCED_CONVERSATION'
  | 'MISSING_MODULE_MATRIX';

export interface AuthorizationModuleInput {
  moduleName: string;
  configuredCommands: string[];
  indexSource: string;
  callbackSource: string;
  textSource: string;
  conversationSources: string[];
}

export interface AuthorizationCoverageViolation {
  code: AuthorizationCoverageViolationCode;
  moduleName: string;
  entryPoint: string;
}

export interface AuthorizationCoverageReport {
  checkedModules: number;
  violations: AuthorizationCoverageViolation[];
}

export function auditAuthorizationCoverage(
  modules: AuthorizationModuleInput[],
  documentedCommands: ReadonlySet<string>,
  documentedModules: ReadonlySet<string>,
): AuthorizationCoverageReport {
  return {
    checkedModules: modules.length,
    violations: modules.flatMap((moduleInput) =>
      auditModule(moduleInput, documentedCommands, documentedModules),
    ),
  };
}

export function renderAuthorizationCoverageReport(report: AuthorizationCoverageReport): string {
  const lines = [
    `Authorization coverage checked ${report.checkedModules} modules.`,
    `Violations: ${report.violations.length}`,
    ...report.violations.map(
      (violation) => `${violation.code}: ${violation.moduleName} -> ${violation.entryPoint}`,
    ),
  ];
  return `${lines.join('\n')}\n`;
}

function auditModule(
  input: AuthorizationModuleInput,
  documentedCommands: ReadonlySet<string>,
  documentedModules: ReadonlySet<string>,
): AuthorizationCoverageViolation[] {
  const violations = auditCommands(input, documentedCommands);
  const registeredCallbacks = input.indexSource.includes("'callback_query:data'");
  const registeredText = input.indexSource.includes("'message:text'");
  const registeredConversations = input.indexSource.includes('createConversation');

  if (registeredCallbacks && !hasCallNamed(input.callbackSource, 'enforce')) {
    violations.push(violation('UNENFORCED_CALLBACK', input, 'callback_query:data'));
  }
  if (registeredText && !hasCallNamed(input.textSource, 'enforce')) {
    violations.push(violation('UNENFORCED_TEXT', input, 'message:text'));
  }
  if (
    registeredConversations &&
    (input.conversationSources.length === 0 ||
      input.conversationSources.some((source) => !hasCallNamed(source, 'refreshAndEnforce')))
  ) {
    violations.push(violation('UNENFORCED_CONVERSATION', input, 'conversation'));
  }
  if (
    (input.configuredCommands.length > 0 ||
      registeredCallbacks ||
      registeredText ||
      registeredConversations) &&
    !documentedModules.has(input.moduleName)
  ) {
    violations.push(violation('MISSING_MODULE_MATRIX', input, input.moduleName));
  }
  return violations;
}

function auditCommands(
  input: AuthorizationModuleInput,
  documentedCommands: ReadonlySet<string>,
): AuthorizationCoverageViolation[] {
  const registered = collectRegisteredCommands(input.indexSource);
  return input.configuredCommands.flatMap((command) => {
    const entryPoint = `/${command}`;
    const guarded = registered.get(command);
    if (guarded === undefined) {
      return [violation('UNREGISTERED_COMMAND', input, entryPoint)];
    }
    if (!guarded) {
      return [violation('UNGUARDED_COMMAND', input, entryPoint)];
    }
    return documentedCommands.has(entryPoint)
      ? []
      : [violation('MISSING_MATRIX_ENTRY', input, entryPoint)];
  });
}

function violation(
  code: AuthorizationCoverageViolationCode,
  input: AuthorizationModuleInput,
  entryPoint: string,
): AuthorizationCoverageViolation {
  return { code, moduleName: input.moduleName, entryPoint };
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('authorization-coverage-audit.ts')) {
  const matrix = readAuthorizationMatrix(process.cwd());
  const report = auditAuthorizationCoverage(
    collectAuthorizationCoverageInputs(process.cwd()),
    matrix.documentedCommands,
    matrix.documentedModules,
  );
  process.stdout.write(renderAuthorizationCoverageReport(report));
  process.exitCode = report.violations.length > 0 ? 1 : 0;
}
