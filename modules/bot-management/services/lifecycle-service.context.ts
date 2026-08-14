import type { IAuditLogger } from '@tempot/database';
import { BotRepository } from '../repositories/bot.repository.js';
import { LifecycleEventRepository } from '../repositories/lifecycle-event.repository.js';
import { getDeps, getLogger } from '../deps.context.js';
import { LifecycleService } from './lifecycle.service.js';

let service: LifecycleService | null = null;

export function initLifecycleService(): void {
  const log = getLogger();
  const auditLogger: IAuditLogger = { log: async (data) => log.debug(data) };
  service = new LifecycleService(
    new BotRepository(auditLogger),
    new LifecycleEventRepository(auditLogger),
    getDeps().eventBus,
  );
}

export function getLifecycleService(): LifecycleService {
  if (!service) {
    throw new Error('bot-management: LifecycleService not initialized.');
  }
  return service;
}
