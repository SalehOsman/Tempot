import { execSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import type { FreshnessReport } from './docs.types.js';

/** Get the last git commit ISO timestamp for a file or directory */
function getGitTimestamp(path: string): string {
  const result = execSync(`git log -1 --format=%cI -- ${path}`, {
    encoding: 'utf-8',
  }).trim();
  return result;
}

/** Find documentation files matching a package name under docs/product/ */
function findDocFiles(packageName: string): string[] {
  const result = execSync(`git ls-files "docs/product/**/*${packageName}*"`, {
    encoding: 'utf-8',
  }).trim();

  if (!result) {
    return [];
  }

  return result.split('\n').filter((line) => line.length > 0);
}

/**
 * Check freshness of documentation for the given packages.
 *
 * For each package, finds matching doc files under docs/product/ and compares
 * git timestamps of the package source directory against each doc file.
 *
 * Returns a FreshnessReport for each (package, docFile) pair where both
 * have valid git timestamps. Pairs with empty timestamps (untracked files)
 * are skipped.
 */
export function checkFreshness(packages: string[]): FreshnessReport[] {
  const reports: FreshnessReport[] = [];

  for (const packageName of packages) {
    const sourcePath = `packages/${packageName}/src/`;
    const docFiles = findDocFiles(packageName);

    if (docFiles.length === 0) {
      continue;
    }

    const sourceMtime = getGitTimestamp(sourcePath);

    if (!sourceMtime) {
      continue;
    }

    for (const docFile of docFiles) {
      const docMtime = getGitTimestamp(docFile);

      if (!docMtime) {
        continue;
      }

      const isStale = new Date(sourceMtime) > new Date(docMtime);

      reports.push({
        package: packageName,
        sourceFile: sourcePath,
        docFile,
        sourceMtime,
        docMtime,
        isStale,
      });
    }
  }

  return reports;
}

/** CLI entry point — discovers all packages and runs freshness check */
function main(): void {
  const packageDirs = readdirSync('packages', { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  const reports = checkFreshness(packageDirs);
  const staleReports = reports.filter((r) => r.isStale);

  const output = JSON.stringify(reports, null, 2);
  process.stdout.write(output + '\n');

  if (staleReports.length === 0) {
    process.stdout.write('All documentation is fresh.\n');
    process.exitCode = 0;
  } else {
    process.stdout.write(`Found ${String(staleReports.length)} stale documentation file(s).\n`);
    process.exitCode = 1;
  }
}

// Run when executed directly
const isDirectExecution =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  (process.argv[1].includes('check-freshness') || process.argv[1].includes('tsx'));

if (isDirectExecution) {
  main();
}
