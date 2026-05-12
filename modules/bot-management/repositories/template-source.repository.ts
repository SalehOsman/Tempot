import { AppError } from '@tempot/shared';
import { ok, err, type Result } from 'neverthrow';
import { ModuleBaseRepository } from './module-base.repository.js';

export interface BotTemplateSource {
  id: string;
  botId: string;
  templateId: string;
  templateVersionId: string;
  templateNameSnapshot: string;
  provisionedBy: string;
  provisionedAt: Date;
}

export interface CreateTemplateSourceInput {
  botId: string;
  templateId: string;
  templateVersionId: string;
  templateNameSnapshot: string;
  provisionedBy: string;
}

export class TemplateSourceRepository extends ModuleBaseRepository<BotTemplateSource> {
  protected moduleName = 'bot-management';
  protected entityName = 'botTemplateSource';

  protected get model() {
    return (this.db as unknown as Record<string, object>)['botTemplateSource'];
  }

  async createForBot(
    input: CreateTemplateSourceInput,
  ): Promise<Result<BotTemplateSource, AppError>> {
    return this.create({
      id: `template-source-${crypto.randomUUID()}`,
      ...input,
      provisionedAt: new Date(),
    });
  }

  async findByBotId(botId: string): Promise<Result<BotTemplateSource, AppError>> {
    const result = await this.findMany({ botId });
    if (result.isErr()) return err(result.error);
    const source = result.value[0];
    return source ? ok(source) : err(new AppError('bot-management.template_source_not_found'));
  }
}
