import { describe, expect, it, vi } from 'vitest';
import { InteractionEventRepository } from '../repositories/interaction-event.repository.js';
import { InteractionTimelineService } from '../services/interaction-timeline.service.js';

function t(key: string, options?: Record<string, unknown>): string {
  return options ? `${key}:${JSON.stringify(options)}` : key;
}

describe('InteractionTimelineService', () => {
  it('renders recent interaction timeline events from the injected provider', async () => {
    const interactionEvents = {
      findMany: vi.fn().mockResolvedValue([
        {
          traceId: 'trace-1',
          sequence: 2,
          module: 'settings-management',
          action: 'settings:regional:timezone',
          stage: 'edit_noop',
          status: 'skipped',
          reason: 'message_not_modified',
          viewKey: 'settings-management.view.regional_timezone',
          createdAt: new Date('2026-05-23T00:00:00.000Z'),
        },
      ]),
    };
    const repository = new InteractionEventRepository({ interactionEvents });
    const service = new InteractionTimelineService(repository);

    const text = await service.renderRecentTimeline(t);

    expect(interactionEvents.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    );
    expect(text).toContain('audit-viewer.timeline.title');
    expect(text).toContain('audit-viewer.timeline.item');
    expect(text).toContain('settings-management');
    expect(text).toContain('message_not_modified');
  });

  it('renders an empty timeline state', async () => {
    const interactionEvents = { findMany: vi.fn().mockResolvedValue([]) };
    const repository = new InteractionEventRepository({ interactionEvents });
    const service = new InteractionTimelineService(repository);

    await expect(service.renderRecentTimeline(t)).resolves.toBe('audit-viewer.timeline.empty');
  });

  it('renders an error state when timeline lookup fails', async () => {
    const interactionEvents = {
      findMany: vi.fn().mockRejectedValue(new Error('database unavailable')),
    };
    const repository = new InteractionEventRepository({ interactionEvents });
    const service = new InteractionTimelineService(repository);

    await expect(service.renderRecentTimeline(t)).resolves.toBe('audit-viewer.timeline.error');
  });

  it('queries recent failed interaction events for problem fallback', async () => {
    const interactionEvents = { findMany: vi.fn().mockResolvedValue([]) };
    const repository = new InteractionEventRepository({ interactionEvents });

    const result = await repository.findRecentFailures(5);

    expect(result.isOk()).toBe(true);
    expect(interactionEvents.findMany).toHaveBeenCalledWith({
      where: {
        module: {
          in: [
            'bot-server',
            'settings-management',
            'notification-center',
            'content-management',
            'audit-viewer',
            'help-center',
            'user-management',
            'bot-management',
            'template-management',
            'input-engine',
          ],
        },
        status: 'failed',
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
  });
});
