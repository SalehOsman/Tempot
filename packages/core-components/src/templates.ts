import { type InlineButton, validateButtonBudgets } from './budgets.js';

export interface RichPageOptions {
  title: string;
  headerIcon?: string;
  bodyBlocks: readonly string[];
  footer?: string;
  isRtl?: boolean;
  buttons?: readonly (readonly InlineButton[])[];
}

export interface RenderedRichMessage {
  text: string;
  parseMode: 'HTML' | 'MarkdownV2';
  buttons?: readonly (readonly InlineButton[])[];
  isRtl: boolean;
}

/**
 * Builds a standardized, RTL-aware Rich Message Page.
 */
export function buildRichPage(options: RichPageOptions): RenderedRichMessage {
  if (options.buttons) {
    validateButtonBudgets(options.buttons);
  }

  const isRtl = options.isRtl ?? true;
  const icon = options.headerIcon ? `${options.headerIcon} ` : '';
  const titleLine = `<b>${icon}${options.title}</b>`;
  const divider = '──────────────────────────';

  const content = [
    titleLine,
    divider,
    '',
    ...options.bodyBlocks,
    ...(options.footer ? ['', divider, `<i>${options.footer}</i>`] : []),
  ].join('\n');

  return {
    text: content,
    parseMode: 'HTML',
    buttons: options.buttons,
    isRtl,
  };
}

export interface ConfirmationOptions {
  title: string;
  summaryLines: readonly string[];
  confirmCallback: string;
  cancelCallback: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isRtl?: boolean;
}

/**
 * Builds an interactive Confirmation Card with Confirm and Cancel buttons.
 */
export function buildRichConfirmation(options: ConfirmationOptions): RenderedRichMessage {
  const isRtl = options.isRtl ?? true;
  const confirmText = options.confirmLabel ?? (isRtl ? '✅ تأكيد' : '✅ Confirm');
  const cancelText = options.cancelLabel ?? (isRtl ? '❌ إلغاء' : '❌ Cancel');

  const buttons: readonly (readonly InlineButton[])[] = [
    [
      { text: confirmText, callbackData: options.confirmCallback },
      { text: cancelText, callbackData: options.cancelCallback },
    ],
  ];

  return buildRichPage({
    title: options.title,
    headerIcon: '📋',
    bodyBlocks: options.summaryLines,
    buttons,
    isRtl,
  });
}
