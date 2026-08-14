import { InlineKeyboard } from 'grammy';
import { ok } from 'neverthrow';
import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { t } from '@tempot/i18n-core';
import type { PaginationOptions } from '../ux.types.js';
import { uxToggle } from '../ux.toggle.js';

export function buildPagination(options: PaginationOptions): Result<InlineKeyboard, AppError> {
  const disabled = uxToggle.check();
  if (disabled) return disabled;

  const { currentPage, totalPages, callbackPrefix } = options;
  const keyboard = new InlineKeyboard();

  if (totalPages <= 1) {
    return ok(keyboard);
  }

  if (currentPage > 1) {
    keyboard.text(t('common.pagination.previous'), `${callbackPrefix}:page:${currentPage - 1}`);
  }

  keyboard.text(
    t('common.pagination.indicator', { current: currentPage, total: totalPages }),
    `${callbackPrefix}:page:${currentPage}`,
  );

  if (currentPage < totalPages) {
    keyboard.text(t('common.pagination.next'), `${callbackPrefix}:page:${currentPage + 1}`);
  }

  return ok(keyboard);
}
