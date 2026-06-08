import { z } from 'zod';
import { err, ok, type Result } from 'neverthrow';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { DocFrontmatter } from './docs.types.js';
import { parseFrontmatter } from './parse-frontmatter.js';

/** Error class for documentation validation failures */
export class DocValidationError extends Error {
  readonly code = 'DOCS_INVALID_FRONTMATTER' as const;

  constructor(message: string) {
    super(message);
    this.name = 'DocValidationError';
  }
}

const docAudienceSchema = z.enum(['package-developer', 'bot-developer', 'operator', 'end-user']);

const docDifficultySchema = z.enum(['beginner', 'intermediate', 'advanced']);

const docFrontmatterSchema = z.object({
  title: z.string().min(1, 'title is required'),
  description: z.string().min(1, 'description is required'),
  tags: z.array(z.string()).min(1, 'tags must have at least one entry'),
  audience: z.array(docAudienceSchema).min(1, 'audience must have at least one entry'),
  contentType: z.literal('developer-docs'),
  package: z.string().optional(),
  difficulty: docDifficultySchema.optional(),
});

/** Validates raw frontmatter data against the DocFrontmatter schema */
export function validateFrontmatter(data: unknown): Result<DocFrontmatter, DocValidationError> {
  const parsed = docFrontmatterSchema.safeParse(data);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    return err(new DocValidationError(`Invalid frontmatter: ${issues}`));
  }

  return ok(parsed.data as DocFrontmatter);
}

export interface FrontmatterFinding {
  file: string;
  message: string;
}

export async function validateDocumentationTree(
  repositoryRoot: string = fileURLToPath(new URL('../../../', import.meta.url)),
): Promise<FrontmatterFinding[]> {
  const trackedFiles = execFileSync('git', ['ls-files', 'docs/product/**/*.md'], {
    cwd: repositoryRoot,
    encoding: 'utf8',
  })
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);
  const findings: FrontmatterFinding[] = [];

  for (const relativeFile of trackedFiles) {
    const file = path.join(repositoryRoot, relativeFile);
    const frontmatter = parseFrontmatter(await readFile(file, 'utf8'));

    if (!frontmatter) {
      findings.push({ file: relativeFile, message: 'Missing YAML frontmatter' });
      continue;
    }

    const result = validateFrontmatter(frontmatter);
    if (result.isErr()) {
      findings.push({ file: relativeFile, message: result.error.message });
    }
  }

  return findings;
}

async function main(): Promise<void> {
  const findings = await validateDocumentationTree();
  for (const finding of findings) {
    process.stderr.write(`${finding.file}: ${finding.message}\n`);
  }
  process.stdout.write(`Frontmatter validation: findings=${findings.length}\n`);
  if (findings.length > 0) process.exitCode = 1;
}

const entryPoint = process.argv[1];
if (entryPoint && import.meta.url === pathToFileURL(entryPoint).href) {
  await main();
}
