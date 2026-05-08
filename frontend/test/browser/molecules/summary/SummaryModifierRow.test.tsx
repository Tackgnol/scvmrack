import { render } from 'vitest-browser-react';
import { expect, describe, it } from 'vitest';
import { page } from 'vitest/browser';
import SummaryModifierRow from '@/components/molecules/summary/SummaryModifierRow';
import BrowserTestProvider from '../../BrowserTestProvider';

describe('SummaryModifierRow Browser', () => {
  it('updates the signed value and label when props change', async () => {
    const { rerender } = await render(
      <BrowserTestProvider>
        <SummaryModifierRow label="Strength" value={2} />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('Strength')).toBeVisible();
    await expect.element(page.getByText('+2')).toBeVisible();

    await rerender(
      <BrowserTestProvider>
        <SummaryModifierRow label="Agility" value={-1} />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('Agility')).toBeVisible();
    await expect.element(page.getByText('-1')).toBeVisible();
    await expect.element(page.getByText('Strength')).not.toBeInTheDocument();
    await expect.element(page.getByText('+2')).not.toBeInTheDocument();

    await rerender(
      <BrowserTestProvider>
        <SummaryModifierRow label="Presence" value={0} />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('Presence')).toBeVisible();
    await expect.element(page.getByText('0')).toBeVisible();
    await expect.element(page.getByText('Agility')).not.toBeInTheDocument();
    await expect.element(page.getByText('-1')).not.toBeInTheDocument();
  });
});
