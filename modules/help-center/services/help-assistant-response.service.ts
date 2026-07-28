import type { HelpAssistantAnswer } from '../contracts/assistant.types.js';

type TranslationFn = (key: string, options?: Record<string, unknown>) => string;

export class HelpAssistantResponseService {
  renderPrompt(t: TranslationFn): string {
    return t('help-center.assistant.prompt');
  }

  renderMissingQuestion(t: TranslationFn): string {
    return t('help-center.assistant.missing_question');
  }

  renderUnavailable(t: TranslationFn): string {
    return t('help-center.assistant.degraded', { reason: 'unavailable' });
  }

  renderFailure(t: TranslationFn, code: string): string {
    return t('help-center.assistant.degraded', { reason: code });
  }

  renderAnswer(t: TranslationFn, answer: HelpAssistantAnswer): string {
    if (answer.state === 'no-context') return t('help-center.assistant.no_context');
    if (answer.state === 'degraded')
      return t('help-center.assistant.degraded', { reason: 'degraded' });
    return [this.renderAnswerBody(t, answer), this.renderCitations(t, answer)].join('\n\n').trim();
  }

  private renderAnswerBody(t: TranslationFn, answer: HelpAssistantAnswer): string {
    return t('help-center.assistant.answer', {
      answer: answer.answer,
      confidence: Math.round(answer.confidence * 100),
    });
  }

  private renderCitations(t: TranslationFn, answer: HelpAssistantAnswer): string {
    if (answer.citations.length === 0) return t('help-center.assistant.citations_empty');
    return [
      t('help-center.assistant.citations_title'),
      ...answer.citations.map((citation, index) =>
        t('help-center.assistant.citation_item', {
          number: index + 1,
          source: citation.sourceId ?? citation.blockId,
        }),
      ),
    ].join('\n');
  }
}
