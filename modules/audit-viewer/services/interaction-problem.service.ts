import type { InteractionProblem } from '../repositories/interaction-audit.repository.js';
import { InteractionAuditRepository } from '../repositories/interaction-audit.repository.js';
import type { InteractionTimelineItem } from '../repositories/interaction-event.repository.js';
import { InteractionEventRepository } from '../repositories/interaction-event.repository.js';

type TranslationFn = (key: string, options?: Record<string, unknown>) => string;

const RECENT_PROBLEM_LIMIT = 5;

export class InteractionProblemService {
  constructor(
    private readonly repository: InteractionAuditRepository,
    private readonly fallbackRepository?: InteractionEventRepository,
  ) {}

  async renderRecentProblems(t: TranslationFn): Promise<string> {
    const result = await this.repository.findRecentProblems(RECENT_PROBLEM_LIMIT);
    if (result.isErr()) return this.renderFallbackProblems(t);
    if (result.value.length === 0) return t('audit-viewer.problems.empty');
    const items = result.value.map((problem) => renderProblem(t, problem));
    return [t('audit-viewer.problems.title'), ...items].join('\n\n');
  }

  private async renderFallbackProblems(t: TranslationFn): Promise<string> {
    if (!this.fallbackRepository) return t('audit-viewer.problems.error');
    const result = await this.fallbackRepository.findRecentFailures(RECENT_PROBLEM_LIMIT);
    if (result.isErr()) return t('audit-viewer.problems.error');
    if (result.value.length === 0) return t('audit-viewer.problems.empty');
    const items = result.value.map((problem) => renderProblem(t, toProblem(problem)));
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

function toProblem(item: InteractionTimelineItem): InteractionProblem {
  return {
    action: item.action ?? '-',
    module: item.module,
    traceId: item.traceId,
    status: item.status,
    timestamp: item.occurredAt,
    referenceCode: item.referenceCode,
    errorCode: item.errorCode,
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
