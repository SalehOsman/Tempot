import { readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export interface ToolchainAuditInput {
  manifest: string;
  workflow: string;
  dockerfile: string;
  roadmap: string;
}

export interface ToolchainFinding {
  ruleId:
    | 'toolchain.pnpm_mismatch'
    | 'toolchain.vitest_coverage_mismatch'
    | 'toolchain.node_minimum_missing'
    | 'toolchain.node_matrix_missing'
    | 'toolchain.docker_runtime_mismatch'
    | 'toolchain.roadmap_mismatch';
  message: string;
}

interface RootManifest {
  packageManager?: unknown;
  engines?: { node?: unknown };
  devDependencies?: Record<string, unknown>;
}

const APPROVED_PNPM_VERSION = '10.33.3';

function workflowPnpmVersion(workflow: string): string | undefined {
  return workflow.match(/PNPM_VERSION:\s*['"]([^'"]+)['"]/)?.[1];
}

function auditVitestVersions(manifest: RootManifest): ToolchainFinding[] {
  const vitest = manifest.devDependencies?.['vitest'];
  const coverage = manifest.devDependencies?.['@vitest/coverage-v8'];
  if (typeof vitest === 'string' && typeof coverage === 'string' && vitest === coverage) return [];

  return [
    {
      ruleId: 'toolchain.vitest_coverage_mismatch',
      message: `vitest=${String(vitest)} coverage=${String(coverage)}`,
    },
  ];
}

export function auditToolchain(input: ToolchainAuditInput): ToolchainFinding[] {
  const manifest = JSON.parse(input.manifest) as RootManifest;
  const findings: ToolchainFinding[] = [];
  const packageManager =
    typeof manifest.packageManager === 'string' ? manifest.packageManager : undefined;
  const manifestPnpmVersion = packageManager?.match(/^pnpm@(.+)$/)?.[1];
  const ciPnpmVersion = workflowPnpmVersion(input.workflow);

  if (
    !manifestPnpmVersion ||
    manifestPnpmVersion !== ciPnpmVersion ||
    manifestPnpmVersion !== APPROVED_PNPM_VERSION
  ) {
    findings.push({
      ruleId: 'toolchain.pnpm_mismatch',
      message: `Expected pnpm ${APPROVED_PNPM_VERSION}; packageManager=${packageManager ?? 'missing'} CI=${ciPnpmVersion ?? 'missing'}`,
    });
  }

  findings.push(...auditVitestVersions(manifest));

  if (manifest.engines?.node !== '>=22.12.0') {
    findings.push({
      ruleId: 'toolchain.node_minimum_missing',
      message: `Expected engines.node >=22.12.0, received ${String(manifest.engines?.node)}`,
    });
  }

  if (!input.workflow.includes("'22.12.0'") || !input.workflow.includes("'24'")) {
    findings.push({
      ruleId: 'toolchain.node_matrix_missing',
      message: 'CI must test Node 22.12.0 and Node 24',
    });
  }

  if (!/^FROM node:22\.12-alpine AS base$/m.test(input.dockerfile)) {
    findings.push({
      ruleId: 'toolchain.docker_runtime_mismatch',
      message: 'Docker base image must use the minimum supported Node 22.12 line',
    });
  }

  if (
    !input.roadmap.includes('Node.js 22.12+') ||
    !input.roadmap.includes(`pnpm ${APPROVED_PNPM_VERSION}`)
  ) {
    findings.push({
      ruleId: 'toolchain.roadmap_mismatch',
      message: `Roadmap toolchain table must document Node.js 22.12+ and pnpm ${APPROVED_PNPM_VERSION}`,
    });
  }

  return findings;
}

function main(): void {
  const repositoryRoot = path.resolve(process.cwd());
  const findings = auditToolchain({
    manifest: readFileSync(path.join(repositoryRoot, 'package.json'), 'utf8'),
    workflow: readFileSync(path.join(repositoryRoot, '.github', 'workflows', 'ci.yml'), 'utf8'),
    dockerfile: readFileSync(path.join(repositoryRoot, 'apps', 'bot-server', 'Dockerfile'), 'utf8'),
    roadmap: readFileSync(path.join(repositoryRoot, 'docs', 'ROADMAP.md'), 'utf8'),
  });

  for (const finding of findings) {
    process.stderr.write(`${finding.ruleId}: ${finding.message}\n`);
  }
  process.stdout.write(`Toolchain audit: findings=${findings.length}\n`);
  if (findings.length > 0) process.exitCode = 1;
}

const entryPoint = process.argv[1];
if (entryPoint && import.meta.url === pathToFileURL(entryPoint).href) {
  main();
}
