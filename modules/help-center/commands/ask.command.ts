import type { Context } from 'grammy';
import type { UserRole } from '@tempot/module-registry';
import { getDeps } from '../deps.context.js';
import { createHelpMenu } from '../menus/help-menu.factory.js';
import { HelpAssistantResponseService } from '../services/help-assistant-response.service.js';
import { extractHelpQuestion } from '../services/help-question-parser.service.js';
import type { HelpAssistantQuestion } from '../contracts/assistant.types.js';
import type { HelpMenuSurface } from '../menus/help-menu.factory.js';

const responseService = new HelpAssistantResponseService();

interface StatusMessage {
  readonly chatId: number | string;
  readonly messageId: number;
}

interface FinalReplyInput {
  readonly ctx: Context;
  readonly text: string;
  readonly surface: HelpMenuSurface;
  readonly status: StatusMessage | null;
}

export async function askCommand(ctx: Context): Promise<void> {
  await answerHelpQuestion(ctx, extractHelpQuestion(ctx.message?.text));
}

export async function answerHelpQuestion(
  ctx: Context,
  question: string,
  surface: HelpMenuSurface = 'leaf',
): Promise<void> {
  const deps = getDeps();
  if (!question) {
    await reply(ctx, responseService.renderMissingQuestion(deps.i18n.t), surface);
    return;
  }

  if (!deps.aiAssistant) {
    await reply(ctx, responseService.renderUnavailable(deps.i18n.t), surface);
    return;
  }

  const status = await reply(ctx, deps.i18n.t('help-center.assistant.searching'), surface);
  const result = await deps.aiAssistant.ask(await buildQuestion(ctx, question));
  const text = result.success
    ? responseService.renderAnswer(deps.i18n.t, result.value)
    : responseService.renderFailure(deps.i18n.t, result.error.code);
  await finishReply({ ctx, text, surface, status: readStatusMessage(ctx, status) });
}

async function buildQuestion(ctx: Context, question: string): Promise<HelpAssistantQuestion> {
  const actor = await resolveActor(ctx);
  return {
    question,
    userId: String(ctx.from?.id ?? 'unknown'),
    chatId: String(ctx.chat?.id ?? ctx.from?.id ?? 'unknown'),
    role: actor.role,
    locale: actor.locale,
  };
}

async function resolveActor(ctx: Context): Promise<{ role: UserRole; locale: string }> {
  const userId = ctx.from?.id;
  const chatId = ctx.chat?.id;
  if (userId === undefined || chatId === undefined) return { role: 'USER', locale: 'ar-EG' };
  const session = await getDeps().sessionProvider.getSession(String(userId), String(chatId));
  return readActor(session) ?? { role: 'USER', locale: 'ar-EG' };
}

function readActor(value: unknown): { role: UserRole; locale: string } | undefined {
  const session = readResultValue(value) ?? value;
  if (!isRecord(session)) return undefined;
  const role = session['role'];
  const locale = session['language'];
  return isUserRole(role)
    ? { role, locale: typeof locale === 'string' ? locale : 'ar-EG' }
    : undefined;
}

function readResultValue(value: unknown): unknown {
  if (!isRecord(value)) return undefined;
  const isOk = value['isOk'];
  if (typeof isOk !== 'function' || isOk.call(value) !== true) return undefined;
  return value['value'];
}

function isUserRole(value: unknown): value is UserRole {
  return value === 'GUEST' || value === 'USER' || value === 'ADMIN' || value === 'SUPER_ADMIN';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function reply(ctx: Context, text: string, surface: HelpMenuSurface): Promise<unknown> {
  return ctx.reply(text, {
    parse_mode: 'HTML',
    reply_markup: createHelpMenu(getDeps().i18n.t, surface),
  });
}

async function finishReply(input: FinalReplyInput): Promise<void> {
  if (!input.status) {
    await reply(input.ctx, input.text, input.surface);
    return;
  }
  try {
    await input.ctx.api.editMessageText(input.status.chatId, input.status.messageId, input.text, {
      parse_mode: 'HTML',
      reply_markup: createHelpMenu(getDeps().i18n.t, input.surface),
    });
  } catch (error) {
    getDeps().logger.warn({ msg: 'help_assistant_status_edit_failed', error: safeError(error) });
    await reply(input.ctx, input.text, input.surface);
  }
}

function readStatusMessage(ctx: Context, sent: unknown): StatusMessage | null {
  const message = isRecord(sent) ? sent : {};
  const chat = isRecord(message['chat']) ? message['chat'] : {};
  const messageId = message['message_id'];
  const chatId = chat['id'] ?? ctx.chat?.id;
  if (typeof messageId !== 'number') return null;
  if (typeof chatId !== 'number' && typeof chatId !== 'string') return null;
  return { chatId, messageId };
}

function safeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
