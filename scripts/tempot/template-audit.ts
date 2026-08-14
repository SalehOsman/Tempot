import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const requiredIgnoreEntries = [
  '.agents/',
  '.claude/',
  '.gemini/',
  '.opencode/',
  '.windsurf/',
  '.specify/',
  '.understand-anything/',
  '.worktrees/',
  '.changeset/',
  '.husky/',
  '.github/workflows/',
  'docs/product/modules/module-methodology.md',
  'docs/product/operations/quality-gates.md',
  'docs/product/governance/',
  'docs/product/ai-context/',
  'docs/guides/TESTING-STRATEGY-EXTENDED.md',
  'docs/operations/RISK-REGISTRY.md',
  'docs/operations/release-evidence-template.md',
  'docs/operations/evidence/',
  'CONTRIBUTING.md',
  'CHANGELOG.md',
  'commitlint.config.js',
  'opencode.json',
  'GEMINI.md',
  'CLAUDE.md',
  'AGENTS.md',
  '.github/',
  'specs/',
  'docs/archive/',
  'docs/architecture/',
  'docs/developer/',
  'docs/development/',
  'docs/project-analysis/',
  'docs/superpowers/',
  'docs/prompt/',
  'docs/ONBOARDING.md',
  'docs/ROADMAP.md',
  'scripts/ci/',
  'scripts/spec-validate/',
  'scripts/security/',
  'scripts/operations/',
  '**/tests/',
  '**/*.test.ts',
  '**/*.spec.ts',
  'node_modules/',
  '.pnpm-store/',
  '.pnpm-store-docs/',
  '.env',
  '.env.*',
  '!.env.example',
];

const deniedTrackedPrefixes = [
  '.agents/',
  '.claude/',
  '.gemini/',
  '.opencode/',
  '.windsurf/',
  '.specify/',
  '.understand-anything/',
  '.changeset/',
  '.husky/',
  '.github/workflows/',
  'docs/product/modules/module-methodology.md',
  'docs/product/operations/quality-gates.md',
  'docs/product/governance/',
  'docs/product/ai-context/',
  'docs/guides/TESTING-STRATEGY-EXTENDED.md',
  'docs/operations/RISK-REGISTRY.md',
  'docs/operations/release-evidence-template.md',
  'docs/operations/evidence/',
  'CONTRIBUTING.md',
  'CHANGELOG.md',
  'commitlint.config.js',
  'opencode.json',
  'GEMINI.md',
  'CLAUDE.md',
  'AGENTS.md',
  '.github/',
  'specs/',
  'docs/archive/',
  'docs/architecture/',
  'docs/developer/',
  'docs/development/',
  'docs/project-analysis/',
  'docs/superpowers/',
  'docs/prompt/',
  'scripts/ci/',
  'scripts/spec-validate/',
  'scripts/security/',
  'scripts/operations/',
];

const deniedTrackedPatterns = [/\/tests\//, /\.test\.ts$/, /\.spec\.ts$/];

function readGitignore(): string {
  if (!existsSync('.gitignore')) {
    throw new Error('Missing .gitignore');
  }

  return readFileSync('.gitignore', 'utf8');
}

function findMissingIgnoreEntries(gitignore: string): string[] {
  return requiredIgnoreEntries.filter((entry) => !gitignore.includes(entry));
}

function listTrackedFiles(): string[] {
  const result = spawnSync('git', ['ls-files'], {
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    return [];
  }

  return result.stdout.split(/\r?\n/u).filter(Boolean);
}

function isDeniedTrackedFile(filePath: string): boolean {
  return (
    deniedTrackedPrefixes.some((prefix) => filePath.startsWith(prefix)) ||
    deniedTrackedPatterns.some((pattern) => pattern.test(filePath))
  );
}

function main(): void {
  const strict = process.env.TEMPOT_TEMPLATE_AUDIT_STRICT === '1';
  const gitignore = readGitignore();
  const missing = findMissingIgnoreEntries(gitignore);
  const deniedTracked = listTrackedFiles().filter(isDeniedTrackedFile);

  if (missing.length > 0) {
    throw new Error(`Missing required .gitignore entries: ${missing.join(', ')}`);
  }

  if (strict && deniedTracked.length > 0) {
    throw new Error(
      `Public template contains denied tracked files: ${deniedTracked.join(', ')}`,
    );
  }

  if (!strict && deniedTracked.length > 0) {
    process.stdout.write(
      `Template audit warning: ${deniedTracked.length} denied files are still tracked in the current development Git history. Reinitialize Git before publishing the new repository.\n`,
    );
  }

  process.stdout.write('Template audit passed.\n');
}

main();
