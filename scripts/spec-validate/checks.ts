/**
 * The 6 structural checks for spec validation.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import type { CheckDetail, CheckResult } from './types.js';
import { PACKAGES_DIR, REQUIRED_ARTIFACTS, SPECS_DIR, PROJECT_ROOT } from './types.js';
import {
  grepDir,
  makeCheck,
  readFileOr,
  readFileLinesOr,
  specDirToPackageName,
} from './file-reader.js';

export function checkArtifactExistence(specDir: string): CheckResult {
  const details: CheckDetail[] = [];
  for (const artifact of REQUIRED_ARTIFACTS) {
    if (!fs.existsSync(path.join(SPECS_DIR, specDir, artifact))) {
      details.push({
        source: `specs/${specDir}/`,
        reference: artifact,
        message: 'Artifact missing',
      });
    }
  }
  return makeCheck('ARTIFACT_EXISTENCE', details);
}

/** Extract unique matches of a pattern from content. */
function extractIds(content: string, pattern: RegExp): Set<string> {
  const ids = new Set<string>();
  let match: RegExpExecArray | null;
  const re = new RegExp(pattern.source, 'g');
  while ((match = re.exec(content)) !== null) ids.add(match[0]);
  return ids;
}

export function checkFrCoverage(specDir: string): CheckResult {
  const specContent = readFileOr(path.join(SPECS_DIR, specDir, 'spec.md'));
  if (specContent === null) return makeCheck('FR_COVERAGE', []);

  const frs = extractIds(specContent, /FR-\d{3}/);
  if (frs.size === 0) return makeCheck('FR_COVERAGE', []);

  const tasksContent = readFileOr(path.join(SPECS_DIR, specDir, 'tasks.md'));
  const details: CheckDetail[] = [];
  for (const fr of frs) {
    if (tasksContent === null || !tasksContent.includes(fr)) {
      details.push({
        source: `specs/${specDir}/spec.md`,
        reference: fr,
        message: `${fr} not found in tasks.md`,
      });
    }
  }
  return makeCheck('FR_COVERAGE', details);
}

export function checkScCoverage(specDir: string): CheckResult {
  const specContent = readFileOr(path.join(SPECS_DIR, specDir, 'spec.md'));
  if (specContent === null) return makeCheck('SC_COVERAGE', []);

  const scs = extractIds(specContent, /SC-\d{3}/);
  if (scs.size === 0) return makeCheck('SC_COVERAGE', []);

  const tasksContent = readFileOr(path.join(SPECS_DIR, specDir, 'tasks.md'));
  const acceptanceSection = specContent.match(/#+\s*acceptance\s+criteria[\s\S]*/i)?.[0] ?? '';
  const details: CheckDetail[] = [];

  for (const sc of scs) {
    const inTasks = tasksContent !== null && tasksContent.includes(sc);
    if (!inTasks && !acceptanceSection.includes(sc)) {
      details.push({
        source: `specs/${specDir}/spec.md`,
        reference: sc,
        message: `${sc} not found in tasks.md or acceptance criteria`,
      });
    }
  }
  return makeCheck('SC_COVERAGE', details);
}

export function checkFileReferences(specDir: string): CheckResult {
  const details: CheckDetail[] = [];
  const fileRefPattern = /packages\/[^\s`)]+\.[a-z]+/g;

  for (const file of ['plan.md', 'tasks.md'] as const) {
    const lines = readFileLinesOr(path.join(SPECS_DIR, specDir, file));
    if (lines === null) continue;

    for (let i = 0; i < lines.length; i++) {
      let match: RegExpExecArray | null;
      const linePattern = new RegExp(fileRefPattern.source, 'g');
      while ((match = linePattern.exec(lines[i])) !== null) {
        const refPath = match[0].replace(/\\/g, '/');
        if (!fs.existsSync(path.join(PROJECT_ROOT, ...refPath.split('/')))) {
          details.push({
            source: `specs/${specDir}/${file}:${i + 1}`,
            reference: refPath,
            message: `${refPath} not found`,
          });
        }
      }
    }
  }
  return makeCheck('FILE_REFERENCES', details);
}

export function checkErrorCodeParity(specDir: string): CheckResult {
  const pkgName = specDirToPackageName(specDir);
  const pkgSrcDir = path.join(PACKAGES_DIR, pkgName, 'src');
  if (!fs.existsSync(pkgSrcDir)) return makeCheck('ERROR_CODE_PARITY', []);

  const errorCodes = new Set<string>();
  for (const file of ['spec.md', 'plan.md'] as const) {
    const content = readFileOr(path.join(SPECS_DIR, specDir, file));
    if (content !== null) {
      for (const id of extractIds(content, /EC-\d{3}/)) errorCodes.add(id);
    }
  }
  if (errorCodes.size === 0) return makeCheck('ERROR_CODE_PARITY', []);

  const details: CheckDetail[] = [];
  for (const ec of errorCodes) {
    if (grepDir(pkgSrcDir, new RegExp(ec.replace('-', '[-_]?'))).length === 0) {
      details.push({
        source: `specs/${specDir}/`,
        reference: ec,
        message: `${ec} defined in spec but not found in packages/${pkgName}/src/`,
      });
    }
  }
  return makeCheck('ERROR_CODE_PARITY', details);
}

export function checkNfrBenchmark(specDir: string): CheckResult {
  const specContent = readFileOr(path.join(SPECS_DIR, specDir, 'spec.md'));
  if (specContent === null) return makeCheck('NFR_BENCHMARK', []);

  const nfrSectionPattern =
    /#+\s*(?:non[- ]?functional|nfr|performance|scalability)[^\n]*\n([\s\S]*?)(?=\n#+\s|\n*$)/gi;
  const nfrTargets: string[] = [];
  let sectionMatch: RegExpExecArray | null;

  while ((sectionMatch = nfrSectionPattern.exec(specContent)) !== null) {
    let measurable: RegExpExecArray | null;
    const mPattern = /[<\u2264>\u2265]\s*\d+\s*(?:ms|MB|s|kb|gb|%)/gi;
    while ((measurable = mPattern.exec(sectionMatch[0])) !== null) {
      nfrTargets.push(measurable[0].trim());
    }
  }
  if (nfrTargets.length === 0) return makeCheck('NFR_BENCHMARK', []);

  const tasksContent = readFileOr(path.join(SPECS_DIR, specDir, 'tasks.md'));
  const benchmarkKeywords =
    /benchmark|perf(ormance)?[\s-]?test|load[\s-]?test|stress[\s-]?test|latency[\s-]?test/i;
  if (tasksContent !== null && benchmarkKeywords.test(tasksContent)) {
    return makeCheck('NFR_BENCHMARK', []);
  }

  const details: CheckDetail[] = nfrTargets.map((target) => ({
    source: `specs/${specDir}/spec.md`,
    reference: target,
    message: `Measurable NFR target "${target}" has no corresponding benchmark task in tasks.md`,
  }));
  return makeCheck('NFR_BENCHMARK', details);
}
