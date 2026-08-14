import type { DoctorCheck, DoctorReport } from './doctor.checks.js';

export interface ModuleDoctorInput {
  readonly cwd: string;
  readonly moduleName: string;
}

export interface ModuleDoctorFileContext {
  readonly cwd: string;
  readonly moduleName: string;
  readonly modulesPath: string;
  readonly modulePath: string;
}

export type ModuleDoctorCheck = DoctorCheck;
export type ModuleDoctorReport = DoctorReport;
