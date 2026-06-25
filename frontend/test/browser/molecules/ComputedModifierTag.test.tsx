import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { afterEach, describe, it, expect, vi } from 'vitest';
import ComputedModifierTag from '@/components/molecules/ComputedModifierTag';
import BrowserTestProvider from '../BrowserTestProvider';
import { type ComputedModifier } from '@/hooks/models';
import i18n, { loadLanguage } from '@/i18n';

describe('ComputedModifierTag Browser', () => {
  const mockModifier: ComputedModifier = {
    statistic: 'strength',
    value: 2,
    originName: 'Belt of Giant Strength',
  };

  const defaultProps = {
    modifier: mockModifier,
    onOpen: vi.fn(),
    isFull: false,
  };

  afterEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('renders origin name, statistic, and value', async () => {
    await render(
      <BrowserTestProvider>
        <ComputedModifierTag {...defaultProps} />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('Belt of Giant Strength')).toBeVisible();
    await expect.element(page.getByText('STR', { exact: true })).toBeVisible();
    await expect.element(page.getByText('+2')).toBeVisible();

  });

  it('renders translated Polish statistic labels', async () => {
    await loadLanguage('pl');
    await i18n.changeLanguage('pl');

    await render(
      <BrowserTestProvider>
        <ComputedModifierTag {...defaultProps} />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('SIŁ', { exact: true })).toBeVisible();
  });

  it('triggers onOpen when clicked', async () => {
    const onOpen = vi.fn();
    await render(
      <BrowserTestProvider>
        <ComputedModifierTag {...defaultProps} onOpen={onOpen} />
      </BrowserTestProvider>
    );

    const tag = page.getByRole('button');
    await userEvent.click(tag);

    await expect.poll(() => onOpen).toHaveBeenCalledWith(mockModifier);

  });
});
