import { t } from '@tempot/i18n-core';
import { STATUS_EMOJIS } from '../constants.js';
import type { StatusFormatOptions } from '../types.js';

export function formatLoading(options: StatusFormatOptions): string {
  return `${STATUS_EMOJIS.loading} ${t(options.key, options.interpolation)}`;
}

export function formatSuccess(options: StatusFormatOptions): string {
  return `${STATUS_EMOJIS.success} ${t(options.key, options.interpolation)}`;
}

export function formatError(options: StatusFormatOptions): string {
  return `${STATUS_EMOJIS.error} ${t(options.key, options.interpolation)}`;
}

export function formatWarning(options: StatusFormatOptions): string {
  return `${STATUS_EMOJIS.warning} ${t(options.key, options.interpolation)}`;
}
