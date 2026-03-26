import { ok } from 'neverthrow';
import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { t } from '@tempot/i18n-core';
import type { ListFormatOptions, ListFormatResult } from '../types.js';
import { toEmojiNumber } from './emoji-number.js';

export function formatList<T>(options: ListFormatOptions<T>): Result<ListFormatResult, AppError> {
  const { titleKey, items, renderItem, emptyStateKey, emptyActionConfig } = options;

  if (items.length === 0) {
    const emptyText = emptyStateKey ? t(emptyStateKey) : '';
    const title = t(titleKey, { count: 0 });
    const text = emptyText ? `${title}\n\n${emptyText}` : title;
    return ok({
      text,
      emptyActionButton: emptyActionConfig,
    });
  }

  const title = t(titleKey, { count: items.length });
  const formattedItems = items
    .map((item, index) => `${toEmojiNumber(index + 1)} ${renderItem(item, index)}`)
    .join('\n');

  return ok({
    text: `${title}\n\n${formattedItems}`,
  });
}
