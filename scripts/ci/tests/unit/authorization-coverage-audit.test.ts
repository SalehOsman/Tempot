import { describe, expect, it } from 'vitest';
import { auditAuthorizationCoverage } from '../../authorization-coverage-audit.js';

describe('authorization coverage audit', () => {
  it('reports configured commands that are registered without an authorization guard', () => {
    const report = auditAuthorizationCoverage(
      [
        {
          moduleName: 'user-management',
          configuredCommands: ['profile'],
          indexSource: "bot.command('profile', profileCommand);",
          callbackSource: '',
          textSource: '',
          conversationSources: [],
        },
      ],
      new Set(['/profile']),
      new Set(['user-management']),
    );

    expect(report.violations).toEqual([
      expect.objectContaining({
        code: 'UNGUARDED_COMMAND',
        entryPoint: '/profile',
      }),
    ]);
  });

  it('reports guarded commands that are absent from the documented matrix', () => {
    const report = auditAuthorizationCoverage(
      [
        {
          moduleName: 'template-management',
          configuredCommands: ['templates'],
          indexSource:
            "bot.command('templates', deps.authorization.guard({ action: 'read' }), templatesCommand);",
          callbackSource: '',
          textSource: '',
          conversationSources: [],
        },
      ],
      new Set(),
      new Set(['template-management']),
    );

    expect(report.violations).toEqual([
      expect.objectContaining({
        code: 'MISSING_MATRIX_ENTRY',
        entryPoint: '/templates',
      }),
    ]);
  });

  it('passes guarded commands and enforced handlers represented in the matrix', () => {
    const report = auditAuthorizationCoverage(
      [
        {
          moduleName: 'bot-management',
          configuredCommands: ['bots'],
          indexSource: [
            "bot.command('bots', deps.authorization.guard({ action: 'read' }), botsCommand);",
            "bot.on('callback_query:data', handleCallbackQuery);",
            'bot.use(createConversation(runBotRegistrationConversation));',
          ].join('\n'),
          callbackSource: 'await getAuthorization().enforce(ctx, policy);',
          textSource: '',
          conversationSources: ['await getAuthorization().refreshAndEnforce(ctx, policy);'],
        },
      ],
      new Set(['/bots']),
      new Set(['bot-management']),
    );

    expect(report.violations).toHaveLength(0);
  });
});
