import { EMOJI_NUMBERS } from '../ux.constants.js';

export function toEmojiNumber(n: number): string {
  if (n >= 1 && n <= EMOJI_NUMBERS.length) {
    return EMOJI_NUMBERS[n - 1]!;
  }
  return `${n}.`;
}
