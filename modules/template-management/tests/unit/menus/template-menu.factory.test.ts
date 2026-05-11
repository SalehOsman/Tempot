import { describe, it, expect } from 'vitest';
import { createMainMenu, createMyTemplatesMenu } from '../../../menus/template-menu.factory.js';

const t = (key: string) => key;

describe('createMainMenu', () => {
  it('returns an InlineKeyboard with 3 buttons', () => {
    const kb = createMainMenu(t);
    const rows = kb.inline_keyboard;
    expect(rows.length).toBeGreaterThanOrEqual(1);

    const allButtons = rows.flat();
    expect(allButtons.length).toBe(3);
  });

  it('includes my_templates, browse, and create callbacks', () => {
    const kb = createMainMenu(t);
    const allButtons = kb.inline_keyboard.flat();
    const callbacks = allButtons.map((b) => b.callback_data);
    expect(callbacks).toContain('tmpl:my');
    expect(callbacks).toContain('tmpl:browse');
    expect(callbacks).toContain('tmpl:create');
  });
});

describe('createMyTemplatesMenu', () => {
  it('shows template buttons', () => {
    const templates = [
      { id: '1', name: 'Bot A', status: 'DRAFT' },
      { id: '2', name: 'Bot B', status: 'PUBLISHED' },
    ];
    const kb = createMyTemplatesMenu({ t, templates, page: 0, totalPages: 1 });
    const allButtons = kb.inline_keyboard.flat();

    const viewCallbacks = allButtons.filter((b) => b.callback_data?.startsWith('tmpl:view:'));
    expect(viewCallbacks.length).toBe(2);
  });

  it('shows pagination when multiple pages', () => {
    const templates = [{ id: '1', name: 'Bot A', status: 'DRAFT' }];
    const kb = createMyTemplatesMenu({ t, templates, page: 0, totalPages: 3 });
    const allButtons = kb.inline_keyboard.flat();

    const nextBtn = allButtons.find((b) => b.callback_data === 'tmpl:page:my:1');
    expect(nextBtn).toBeDefined();
  });

  it('shows back button', () => {
    const kb = createMyTemplatesMenu({ t, templates: [], page: 0, totalPages: 1 });
    const allButtons = kb.inline_keyboard.flat();
    const backBtn = allButtons.find((b) => b.callback_data === 'tmpl:menu');
    expect(backBtn).toBeDefined();
  });
});
