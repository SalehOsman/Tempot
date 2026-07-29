import type { Context, NextFunction } from 'grammy';
import { getDeps } from '../deps.context.js';
import { answerHelpQuestion } from '../commands/ask.command.js';
import { parseSmartHelpQuestion } from '../services/help-question-parser.service.js';
import { consumeAwaitingQuestion } from '../services/help-question-session.service.js';

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

  if (isCommand(text) || !(await consumeAwaitingQuestion(ctx, getDeps().sessionProvider))) {
    await next();
    return;
  }

  await answerHelpQuestion(ctx, text?.trim() ?? '');
}

function isCommand(text: string | undefined): boolean {
  return text?.trim().startsWith('/') === true;
}
