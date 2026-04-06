import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { err, ok, type Result } from 'neverthrow';
import { validateFrontmatter, DocValidationError } from './validate-frontmatter.js';
import { parseFrontmatter } from './parse-frontmatter.js';
import type {
  DocGenerationConfig,
  PackageInfo,
  DocOutput,
  GenerateCliArgs,
  PromptBuildContext,
} from './docs.types.js';

export type { PackageInfo, DocOutput, PromptBuildContext } from './docs.types.js';
export type CliArgs = GenerateCliArgs;

/** Discover all packages in the monorepo */
export async function discoverPackages(): Promise<PackageInfo[]> {
  const entries = await readdir('packages', { withFileTypes: true });
  const packages: PackageInfo[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const name = entry.name;
    const specDir = findSpecDir(name);
    packages.push({
      name,
      sourceDir: `packages/${name}/src`,
      specDir,
      hasSpecArtifacts: specDir.length > 0,
    });
  }

  return packages;
}

/** Find SpecKit spec directory for a package */
function findSpecDir(packageName: string): string {
  if (!existsSync('specs')) return '';
  const candidate = `specs/${packageName}`;
  if (existsSync(candidate) && existsSync(`${candidate}/spec.md`)) return candidate;
  return '';
}

/** Read SpecKit artifacts and return prompt sections */
async function readSpecArtifacts(specDir: string): Promise<string[]> {
  const sections: string[] = ['## SpecKit Artifacts', ''];
  const artifacts = ['spec.md', 'plan.md', 'data-model.md'] as const;
  for (const artifact of artifacts) {
    const filePath = `${specDir}/${artifact}`;
    if (!existsSync(filePath)) {
      process.stderr.write(
        JSON.stringify({ level: 'warn', msg: `Missing artifact: ${filePath}` }) + '\n',
      );
      continue;
    }
    try {
      const content = await readFile(filePath, 'utf-8');
      const label = artifact.replace('.md', '').replace(/-/g, ' ');
      const title = label.replace(/\b\w/g, (c) => c.toUpperCase());
      sections.push(`### ${title}`, content, '');
    } catch (error: unknown) {
      process.stderr.write(
        JSON.stringify({ level: 'warn', msg: `Failed to read ${filePath}: ${String(error)}` }) +
          '\n',
      );
    }
  }
  return sections;
}

/** Read source files and return prompt sections */
async function readSourceFiles(sourceDir: string): Promise<string[]> {
  const sections: string[] = ['## Source Code', ''];
  const entries = await readdir(sourceDir, { withFileTypes: true });
  for (const file of entries.filter((e) => e.isFile())) {
    const content = await readFile(`${sourceDir}/${file.name}`, 'utf-8');
    sections.push(`### ${file.name}`, '```typescript', content, '```', '');
  }
  return sections;
}

/** Build prompt instructions section */
function buildInstructions(hasSpecs: boolean): string[] {
  const lines = [
    '## Instructions',
    '',
    'Generate Starlight-compatible Markdown documentation for this package.',
    'The output MUST include YAML frontmatter with these fields:',
    '- title: string (required)',
    '- description: string (required)',
    '- tags: string[] (at least one)',
    '- audience: DocAudience[] (at least one)',
    '- contentType: "developer-docs" (required literal)',
    '- package: string (optional, set to package name)',
    '- difficulty: "beginner" | "intermediate" | "advanced" (optional)',
    '',
  ];
  if (!hasSpecs) {
    lines.push(
      'NOTE: This is a pre-methodology package. Generate documentation from source code and JSDoc comments only.',
    );
  }
  return lines;
}

/** Build a documentation generation prompt for a package */
export async function buildDocPrompt(ctx: PromptBuildContext): Promise<string> {
  const sections: string[] = [
    `# Documentation Generation for: ${ctx.name}`,
    `Locale: ${ctx.locale}`,
    '',
  ];

  if (ctx.hasSpecArtifacts && ctx.specDir) {
    sections.push(...(await readSpecArtifacts(ctx.specDir)));
  } else {
    process.stderr.write(
      JSON.stringify({
        level: 'warn',
        msg: `No SpecKit artifacts found for ${ctx.name} — using source code and JSDoc only`,
      }) + '\n',
    );
  }

  sections.push(...(await readSourceFiles(ctx.sourceDir)));
  sections.push(...buildInstructions(ctx.hasSpecArtifacts));
  return sections.join('\n');
}

/** Process an AI response, validating frontmatter and extracting content */
export function processAIResponse(
  response: string,
  _config: DocGenerationConfig,
): Result<DocOutput, DocValidationError> {
  const frontmatterData = parseFrontmatter(response);
  if (!frontmatterData) {
    return err(new DocValidationError('AI response does not contain YAML frontmatter'));
  }

  const validation = validateFrontmatter(frontmatterData);
  if (validation.isErr()) return err(validation.error);

  const contentMatch = /^---\r?\n[\s\S]*?\r?\n---\r?\n(.*)$/s.exec(response);
  const content = contentMatch ? contentMatch[1].trim() : '';

  return ok({ frontmatter: validation.value, content });
}

/** Parse CLI arguments */
export function parseCliArgs(args: string[]): CliArgs {
  const result: CliArgs = { locale: 'en' };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--package' && i + 1 < args.length) {
      result.package = args[i + 1];
      i++;
    }
    if (args[i] === '--locale' && i + 1 < args.length) {
      const locale = args[i + 1];
      if (locale === 'ar' || locale === 'en') result.locale = locale;
      i++;
    }
  }
  return result;
}

/** CLI entry point */
async function main(): Promise<void> {
  const args = parseCliArgs(process.argv.slice(2));
  const allPackages = await discoverPackages();
  const targetPackages = args.package
    ? allPackages.filter((p) => p.name === args.package)
    : allPackages;

  if (targetPackages.length === 0) {
    process.stderr.write(
      JSON.stringify({ level: 'error', msg: `Package not found: ${args.package ?? '(none)'}` }) +
        '\n',
    );
    process.exitCode = 1;
    return;
  }

  for (const pkg of targetPackages) {
    const prompt = await buildDocPrompt({ ...pkg, locale: args.locale });
    process.stdout.write(prompt + '\n');
  }
}

const isDirectExecution =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  (process.argv[1].includes('generate-docs') || process.argv[1].includes('tsx'));

if (isDirectExecution) {
  main().catch((error: unknown) => {
    process.stderr.write(JSON.stringify({ level: 'error', msg: String(error) }) + '\n');
    process.exitCode = 1;
  });
}
