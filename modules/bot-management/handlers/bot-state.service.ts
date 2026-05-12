export type BotInputStep = 'display_name' | 'telegram_username' | 'token';

export interface BotInputState {
  step: BotInputStep;
  data: {
    displayName?: string;
    telegramUsername?: string;
  };
}

const states = new Map<string, BotInputState>();

export async function setBotInputState(
  telegramId: string,
  chatId: string,
  state: BotInputState,
): Promise<void> {
  states.set(key(telegramId, chatId), state);
}

export async function getBotInputState(
  telegramId: string,
  chatId: string,
): Promise<BotInputState | null> {
  return states.get(key(telegramId, chatId)) ?? null;
}

export async function clearBotInputState(telegramId: string, chatId: string): Promise<void> {
  states.delete(key(telegramId, chatId));
}

function key(telegramId: string, chatId: string): string {
  return `${telegramId}:${chatId}`;
}
