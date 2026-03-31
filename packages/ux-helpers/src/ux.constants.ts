import type { StatusType, CharacterLimits, RowLimits, CallbackSeparator } from './ux.types.js';

/** Status emoji mapping per Rule LXV */
export const STATUS_EMOJIS: Record<StatusType, string> = {
  loading: '\u23F3',
  success: '\u2705',
  error: '\u274C',
  warning: '\u26A0\uFE0F',
};

/** Character limits per Section 13.1 */
export const CHAR_LIMITS: CharacterLimits = {
  inline: { ar: 20, en: 24 },
  reply: { ar: 15, en: 18 },
};

/** Row limits per Section 13.1 */
export const ROW_LIMITS: RowLimits = {
  inline: 3,
  reply: 2,
};

/** Confirmation expiry duration in minutes per Rule LXVII */
export const CONFIRMATION_EXPIRY_MINUTES = 5;

/** Callback data separator */
export const CALLBACK_SEPARATOR: CallbackSeparator = ':';

/** Maximum callback data bytes (Telegram limit) */
export const MAX_CALLBACK_BYTES = 64;

/** Maximum Telegram message length */
export const MAX_MESSAGE_LENGTH = 4096;

/** Pagination threshold per Section 13.7 */
export const PAGINATION_THRESHOLD = 5;

/** Emoji numbers for list items per Rule LXVIII */
export const EMOJI_NUMBERS: readonly string[] = [
  '1\uFE0F\u20E3',
  '2\uFE0F\u20E3',
  '3\uFE0F\u20E3',
  '4\uFE0F\u20E3',
  '5\uFE0F\u20E3',
  '6\uFE0F\u20E3',
  '7\uFE0F\u20E3',
  '8\uFE0F\u20E3',
  '9\uFE0F\u20E3',
  '\uD83D\uDD1F',
];

/** Unicode range for Arabic characters */
export const ARABIC_CHAR_RANGE_START = 0x0600;
export const ARABIC_CHAR_RANGE_END = 0x06ff;

/** Arabic Supplement range */
export const ARABIC_SUPPLEMENT_START = 0x0750;
export const ARABIC_SUPPLEMENT_END = 0x077f;

/** Arabic Extended-A range */
export const ARABIC_EXTENDED_A_START = 0x08a0;
export const ARABIC_EXTENDED_A_END = 0x08ff;

/** Emoji bullet for list items per Section 13.2 */
export const EMOJI_BULLET = '\u25CF';
