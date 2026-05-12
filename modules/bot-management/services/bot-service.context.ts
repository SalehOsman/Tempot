import type { IAuditLogger } from '@tempot/database';
import { BotRepository } from '../repositories/bot.repository.js';
import { BotService } from './bot.service.js';
import { getDeps, getLogger } from '../deps.context.js';

let service: BotService | null = null;

export function initBotService(): void {
  const log = getLogger();
  const auditLogger: IAuditLogger = { log: async (data) => log.debug(data) };
  service = new BotService(new BotRepository(auditLogger), getDeps().eventBus);
}

export function getBotService(): BotService {
  if (!service) {
    throw new Error('bot-management: BotService not initialized.');
  }
  return service;
}
