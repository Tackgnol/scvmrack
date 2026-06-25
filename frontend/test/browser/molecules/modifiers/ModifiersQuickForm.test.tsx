import { render } from 'vitest-browser-react';
import { afterEach, expect, describe, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import ModifiersQuickForm from '@/components/molecules/modifiers/ModifiersQuickForm';
import BrowserTestProvider from '../../BrowserTestProvider';
import i18n, { loadLanguage } from '@/i18n';

describe('ModifiersQuickForm Browser', () => {
  const defaultProps = {
    name: '',
    stat: 'strength' as const,
    valueStr: '0',
    scope: 'all' as const,
    onNameChange: vi.fn(),
    onStatChange: vi.fn(),
    onValueChange: vi.fn(),
    onScopeChange: vi.fn(),
    onSubmit: vi.fn(),
    onOpenAdvanced: vi.fn(),
  };

  afterEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('renders correctly', async () => {
    await render(
      <BrowserTestProvider>
        <ModifiersQuickForm {...defaultProps} />
      </BrowserTestProvider>
    );

    // Initial state check
    const valueInput = page.getByRole('spinbutton');
    await expect.element(valueInput).toBeVisible();
    await expect.element(valueInput).toHaveValue(0);

    const nameInput = page.getByPlaceholder(/name/i);
    await expect.element(nameInput).toBeVisible();

  });

  it('renders Polish labels after switching language', async () => {
    await loadLanguage('pl');
    await i18n.changeLanguage('pl');

    await render(
      <BrowserTestProvider>
        <ModifiersQuickForm {...defaultProps} />
      </BrowserTestProvider>
    );

    await expect
      .element(page.getByPlaceholder('Nazwa modyfikatora...'))
      .toBeVisible();
    await expect.element(page.getByText('SIŁ', { exact: true })).toBeVisible();
    await expect.element(page.getByText('Wszystkie testy')).toBeVisible();
    await expect
      .element(page.getByRole('button', { name: 'Dodaj modyfikator' }))
      .toBeVisible();
  });

  it('triggers onAdd when button is clicked', async () => {
    const onSubmit = vi.fn();
    await render(
      <BrowserTestProvider>
        <ModifiersQuickForm {...defaultProps} onSubmit={onSubmit} />
      </BrowserTestProvider>
    );

    const addButton = page.getByTestId('quick-mod-add-btn');
    await userEvent.click(addButton);

    await expect.poll(() => onSubmit).toHaveBeenCalled();

  });

  it('triggers onOpenAdvanced when advanced button is clicked', async () => {
    const onOpenAdvanced = vi.fn();
    await render(
      <BrowserTestProvider>
        <ModifiersQuickForm {...defaultProps} onOpenAdvanced={onOpenAdvanced} />
      </BrowserTestProvider>
    );

    // Advanced button is an IconButton with tooltip, likely has aria-label
    // Or we can find by text if it's visible, but it's an icon.
    // Based on source it had a Tooltip and an icon.
    const advancedBtn = page.getByTestId('advanced-mod-btn');
    await userEvent.click(advancedBtn);

    await expect.poll(() => onOpenAdvanced).toHaveBeenCalled();

  });
});
