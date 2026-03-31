/**
 * Type definitions and constants for the spec-validate script.
 */

import * as path from 'node:path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM';
export type Status = 'PASS' | 'FAIL';

export interface CheckDetail {
  source: string;
  reference: string;
  message: string;
}

export type CheckId =
  | 'ARTIFACT_EXISTENCE'
  | 'FR_COVERAGE'
  | 'SC_COVERAGE'
  | 'FILE_REFERENCES'
  | 'ERROR_CODE_PARITY'
  | 'NFR_BENCHMARK';

export interface CheckResult {
  id: CheckId;
  status: Status;
  severity: Severity;
  details: CheckDetail[];
}

export interface PackageReport {
  package: string;
  timestamp: string;
  summary: { critical: number; high: number; medium: number; pass: number };
  checks: CheckResult[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const PROJECT_ROOT = path.resolve(import.meta.dirname, '..', '..');
export const SPECS_DIR = path.join(PROJECT_ROOT, 'specs');
export const PACKAGES_DIR = path.join(PROJECT_ROOT, 'packages');

export const REQUIRED_ARTIFACTS = [
  'spec.md',
  'plan.md',
  'tasks.md',
  'data-model.md',
  'research.md',
] as const;

export const SEVERITY_MAP: Record<CheckId, Severity> = {
  ARTIFACT_EXISTENCE: 'CRITICAL',
  FR_COVERAGE: 'CRITICAL',
  SC_COVERAGE: 'HIGH',
  FILE_REFERENCES: 'HIGH',
  ERROR_CODE_PARITY: 'HIGH',
  NFR_BENCHMARK: 'MEDIUM',
};
