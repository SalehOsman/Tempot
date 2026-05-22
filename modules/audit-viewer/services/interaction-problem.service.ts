import type { InteractionProblem } from '../repositories/interaction-audit.repository.js';
import { InteractionAuditRepository } from '../repositories/interaction-audit.repository.js';

type TranslationFn = (key: string, options?: Record<string, unknown>) => string;

const RECENT_PROBLEM_LIMIT = 5;

export class InteractionProblemService {
  constructor(private readonly repository: InteractionAuditRepository) {}

  async renderRecentProblems(t: TranslationFn): Promise<string> {
    const result = await this.repository.findRecentProblems(RECENT_PROBLEM_LIMIT);
    if (result.isErr()) return t('audit-viewer.problems.error');
    if (result.value.length === 0) return t('audit-viewer.problems.empty');
    const items = result.value.map((problem) => renderProblem(t, problem));
    return [t('audit-viewer.problems.title'), ...items].join('\n\n');
  }
}

function renderProblem(t: TranslationFn, problem: InteractionProblem): string {
  return t('audit-viewer.problems.item', {
    action: escapeHtml(problem.action),
    module: escapeHtml(problem.module),
    traceId: escapeHtml(problem.traceId ?? '-'),
    referenceCode: escapeHtml(problem.referenceCode ?? '-'),
    errorCode: escapeHtml(problem.errorCode ?? '-'),
  });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
