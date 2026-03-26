import { t } from '@tempot/i18n-core';
import { STATUS_EMOJIS } from '../constants.js';
import type {
  UserErrorOptions,
  SystemErrorOptions,
  PermissionErrorOptions,
  SessionExpiredOptions,
  SessionExpiredResult,
} from '../types.js';

export function formatUserError(options: UserErrorOptions): string {
  const problem = t(options.problemKey, options.interpolation);
  const solution = t(options.solutionKey, options.interpolation);
  return `${STATUS_EMOJIS.error} ${problem}\n${solution}`;
}

export function formatSystemError(options: SystemErrorOptions): string {
  const message = t('common.errors.system');
  const reference = t('common.errors.reference', { code: options.referenceCode });
  return `${STATUS_EMOJIS.error} ${message}\n${reference}`;
}

export function formatPermissionError(options: PermissionErrorOptions): string {
  return `${STATUS_EMOJIS.error} ${t(options.reasonKey)}`;
}

export function formatSessionExpired(options: SessionExpiredOptions): SessionExpiredResult {
  return {
    text: t('common.errors.session_expired'),
    restartButton: {
      label: t('common.errors.session_expired_restart'),
      callbackData: options.restartCallbackData,
    },
  };
}
