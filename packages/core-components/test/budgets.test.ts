import { describe, expect, it } from 'vitest';
import { type InlineButton, TELEGRAM_LIMITS, validateButtonBudgets } from '../src/budgets.js';
import { buildRichConfirmation, buildRichPage } from '../src/templates.js';

describe('Telegram Budgets & Rich Components Specification', () => {
  it('passes when buttons and callbacks are within mobile budgets', () => {
    const validButtons: readonly (readonly InlineButton[])[] = [
      [
        { text: 'زر قصير', callbackData: 'action:proceed' },
        { text: 'زر ثان', callbackData: 'action:cancel' },
      ],
    ];

    expect(() => validateButtonBudgets(validButtons)).not.toThrow();
  });

  it('throws ValidationError when button label exceeds 32 characters', () => {
    const oversizedLabelButtons: readonly (readonly InlineButton[])[] = [
      [
        {
          text: 'This is a very long button label that exceeds thirty two characters limit',
          callbackData: 'ok',
        },
      ],
    ];

    expect(() => validateButtonBudgets(oversizedLabelButtons)).toThrow('exceeds 32 chars');
  });

  it('throws ValidationError when callback data exceeds 64 bytes', () => {
    const oversizedCallbackButtons: readonly (readonly InlineButton[])[] = [
      [{ text: 'Sample Button', callbackData: 'a'.repeat(70) }],
    ];

    expect(() => validateButtonBudgets(oversizedCallbackButtons)).toThrow(
      'exceeding budgeted limit of 64 bytes',
    );
  });

  it('throws ValidationError when rows exceed 7', () => {
    const tooManyRows: (readonly InlineButton[])[] = Array.from({ length: 8 }, () => [
      { text: 'زر', callbackData: 'btn' },
    ]);

    expect(() => validateButtonBudgets(tooManyRows)).toThrow('exceed maximum allowable rows');
  });

  it('renders standard RTL Rich Page with dividers and HTML parse mode', () => {
    const page = buildRichPage({
      title: 'لوحة التحكم',
      headerIcon: '📊',
      bodyBlocks: ['السطر الأول من الرسالة', 'السطر الثاني من الرسالة'],
      footer: 'نص التذييل',
      isRtl: true,
    });

    expect(page.parseMode).toBe('HTML');
    expect(page.isRtl).toBe(true);
    expect(page.text).toContain('<b>📊 لوحة التحكم</b>');
    expect(page.text).toContain('──────────────────────────');
    expect(page.text).toContain('<i>نص التذييل</i>');
  });

  it('renders confirmation card with confirm and cancel buttons', () => {
    const card = buildRichConfirmation({
      title: 'تأكيد الحذف',
      summaryLines: ['هل أنت متأكد من رغبتك في المتابعة؟'],
      confirmCallback: 'act:confirm',
      cancelCallback: 'act:cancel',
      isRtl: true,
    });

    expect(card.parseMode).toBe('HTML');
    expect(card.buttons).toBeDefined();
    expect(card.buttons?.[0][0].text).toBe('✅ تأكيد');
    expect(card.buttons?.[0][1].text).toBe('❌ إلغاء');
  });
});
