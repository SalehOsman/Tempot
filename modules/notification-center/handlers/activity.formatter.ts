import type { NotificationAuditRecord, NotificationInteractionRecord } from '../index.js';

type TranslationFn = (key: string, options?: Record<string, unknown>) => string;

export function summarizeInteractionActivity(
  records: readonly NotificationInteractionRecord[],
): NotificationInteractionRecord[] {
  const visibleRecords = records.filter(
    (record) => isTerminalStatus(record.status) && record.callbackData !== 'notifications:activity',
  );
  const dedupedRecords: NotificationInteractionRecord[] = [];
  const seenTraceIds = new Set<string>();
  for (const record of visibleRecords) {
    if (record.traceId) {
      if (seenTraceIds.has(record.traceId)) continue;
      seenTraceIds.add(record.traceId);
    }
    dedupedRecords.push(record);
  }
  return dedupedRecords.slice(0, 5);
}

export function formatInteractionActivity(
  record: NotificationInteractionRecord,
  t: TranslationFn,
): string {
  return t('notification-center.view.activity_item', {
    action: resolveActivityActionLabel(record.callbackData, t),
    occurredAt: formatActivityTimestamp(record.occurredAt),
    status: resolveActivityStatusLabel(record.status, t),
  });
}

export function formatAuditActivity(record: NotificationAuditRecord, t: TranslationFn): string {
  return t('notification-center.view.activity_item', {
    action: resolveActivityActionLabel(record.action, t),
    occurredAt: formatActivityTimestamp(record.timestamp),
    status: resolveActivityStatusLabel(record.status, t),
  });
}

function resolveActivityActionLabel(action: string | null | undefined, t: TranslationFn): string {
  const actionName = action?.split(':')[1] ?? action ?? 'unknown';
  const keyByAction: Record<string, string> = {
    activity: 'notification-center.view.activity_labels.action.activity',
    preferences: 'notification-center.view.activity_labels.action.preferences',
    test: 'notification-center.view.activity_labels.action.test',
    toggle: 'notification-center.view.activity_labels.action.toggle',
    view: 'notification-center.view.activity_labels.action.view',
  };
  return t(keyByAction[actionName] ?? 'notification-center.view.activity_labels.action.unknown');
}

function resolveActivityStatusLabel(status: string, t: TranslationFn): string {
  const keyByStatus: Record<string, string> = {
    completed: 'notification-center.view.activity_labels.status.completed',
    failed: 'notification-center.view.activity_labels.status.failed',
    handled: 'notification-center.view.activity_labels.status.handled',
    received: 'notification-center.view.activity_labels.status.received',
    responded: 'notification-center.view.activity_labels.status.responded',
    success: 'notification-center.view.activity_labels.status.succeeded',
    succeeded: 'notification-center.view.activity_labels.status.succeeded',
  };
  return t(keyByStatus[status] ?? 'notification-center.view.activity_labels.status.unknown');
}

function formatActivityTimestamp(value: Date): string {
  const timestamp = value.toISOString();
  const year = timestamp.slice(0, 4);
  const month = timestamp.slice(5, 7);
  const day = timestamp.slice(8, 10);
  const time = timestamp.slice(11, 16);
  return `${day}/${month}/${year} ${time}`;
}

function isTerminalStatus(status: string): boolean {
  return ['completed', 'handled', 'success', 'succeeded'].includes(status);
}
