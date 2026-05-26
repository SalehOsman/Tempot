import { join } from 'node:path';
import type {
  ModuleDoctorCheck,
  ModuleDoctorFileContext,
  ModuleDoctorInput,
  ModuleDoctorReport,
} from './module-doctor.types.js';
import {
  checkLocaleParity,
  checkModuleDirectory,
  checkModuleImports,
  checkPackageMetadata,
  checkRequiredFiles,
} from './module-doctor.basic-checks.js';
import { checkModuleFlowMap } from './module-flow.checks.js';

export async function createModuleDoctorReport(
  input: ModuleDoctorInput,
): Promise<ModuleDoctorReport> {
  const modulesPath = join(input.cwd, 'modules');
  const modulePath = join(modulesPath, input.moduleName);
  const context: ModuleDoctorFileContext = {
    cwd: input.cwd,
    moduleName: input.moduleName,
    modulesPath,
    modulePath,
  };

  const directoryCheck = checkModuleDirectory(context);

  if (directoryCheck.status === 'fail') {
    return buildReport(input.moduleName, [directoryCheck]);
  }

  const checks = [
    directoryCheck,
    checkRequiredFiles(context),
    await checkPackageMetadata(context),
    await checkLocaleParity(context),
    await checkModuleImports(context),
    await checkModuleFlowMap(context),
  ];

  return buildReport(input.moduleName, checks);
}

function buildReport(moduleName: string, checks: readonly ModuleDoctorCheck[]): ModuleDoctorReport {
  return {
    title: `Tempot Module Doctor: ${moduleName}`,
    checks,
    hasBlockingFailure: checks.some((check) => check.blocking && check.status === 'fail'),
  };
}
