import { z } from 'zod';
import { err, ok, type Result } from 'neverthrow';
import type { DocFrontmatter } from './docs.types.js';

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
