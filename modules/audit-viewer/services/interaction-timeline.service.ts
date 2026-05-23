import type { InteractionTimelineItem } from '../repositories/interaction-event.repository.js';
import { InteractionEventRepository } from '../repositories/interaction-event.repository.js';

type TranslationFn = (key: string, options?: Record<string, unknown>) => string;

const RECENT_TIMELINE_LIMIT = 10;

export class InteractionTimelineService {
  constructor(private readonly repository: InteractionEventRepository) {}

  async renderRecentTimeline(t: TranslationFn): Promise<string> {
    const result = await this.repository.findRecentTimeline(RECENT_TIMELINE_LIMIT);
    if (result.isErr()) return t('audit-viewer.timeline.error');
    if (result.value.length === 0) return t('audit-viewer.timeline.empty');
    const items = result.value.map((item) => renderTimelineItem(t, item));
    return [t('audit-viewer.timeline.title'), ...items].join('\n\n');
  }
}

function renderTimelineItem(t: TranslationFn, item: InteractionTimelineItem): string {
  return t('audit-viewer.timeline.item', {
    traceId: escapeHtml(item.traceId),
    sequence: item.sequence,
    module: escapeHtml(item.module),
    action: escapeHtml(item.action ?? '-'),
    stage: escapeHtml(item.stage),
    status: escapeHtml(item.status),
    reason: escapeHtml(item.reason ?? '-'),
    viewKey: escapeHtml(item.viewKey ?? '-'),
    occurredAt: escapeHtml(item.occurredAt),
  });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
