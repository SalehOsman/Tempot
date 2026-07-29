import type { Context, NextFunction } from 'grammy';
import { getDeps } from '../deps.context.js';
import { answerHelpQuestion } from '../commands/ask.command.js';
import { parseSmartHelpQuestion } from '../services/help-question-parser.service.js';
import { isAssistantSessionOpen } from '../services/help-question-session.service.js';

const noopNext: NextFunction = () => Promise.resolve();

export async function handleTextMessage(
  ctx: Context,
  next: NextFunction = noopNext,
): Promise<void> {
  const text = ctx.message?.text;
  const smartQuestion = parseSmartHelpQuestion(text);
  if (smartQuestion !== null) {
    await answerHelpQuestion(ctx, smartQuestion);
    return;
  }

  if (isCommand(text) || !(await isAssistantSessionOpen(ctx, getDeps().sessionProvider))) {
    await next();
    return;
  }

  await answerHelpQuestion(ctx, text?.trim() ?? '', 'assistant-session');
}

function isCommand(text: string | undefined): boolean {
  return text?.trim().startsWith('/') === true;
}
