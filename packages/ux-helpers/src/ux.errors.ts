/** Hierarchical error codes for UX module (Rule XXII) */
export const UX_ERRORS = {
  // Label validation
  LABEL_EMPTY: 'ux.label.empty',
  LABEL_TOO_LONG: 'ux.label.too_long',
  LABEL_NO_EMOJI: 'ux.label.no_emoji',

  // Callback data
  CALLBACK_TOO_LONG: 'ux.callback.too_long',
  CALLBACK_EMPTY: 'ux.callback.empty',
  CALLBACK_DECODE_FAILED: 'ux.callback.decode_failed',

  // Confirmation
  CONFIRMATION_EXPIRED: 'ux.confirmation.expired',

  // Message
  MESSAGE_TOO_LONG: 'ux.message.too_long',
  MESSAGE_EDIT_FAILED: 'ux.message.edit_failed',
  MESSAGE_SEND_FAILED: 'ux.message.send_failed',

  // Context
  CONTEXT_NO_MESSAGE: 'ux.context.no_message',
  CONTEXT_NO_CHAT: 'ux.context.no_chat',
  CALLBACK_QUERY_FAILED: 'ux.callback_query.failed',

  // Typing
  TYPING_FAILED: 'ux.typing.failed',
} as const;
