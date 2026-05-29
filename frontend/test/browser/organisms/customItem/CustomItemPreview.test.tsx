import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import BrowserTestProvider from '../../BrowserTestProvider';
import CustomItemPreview from '@/components/organisms/customItem/CustomItemPreview';

describe('CustomItemPreview', () => {
  it('shows an empty-state prompt before an item has a name', async () => {
    await render(
      <BrowserTestProvider>
        <CustomItemPreview items={[]} kind="misc" />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText(/name the item/i)).toBeVisible();
  });

  it('summarizes primary item stats and bundled ammo', async () => {
    await render(
      <BrowserTestProvider>
        <CustomItemPreview
          kind="weapon"
          items={[
            {
              name: 'Bone Bow',
              description: 'Cracked but eager.',
              dice: [6],
              ammoType: 'Arrow',
              value: 20,
              modifiers: [{ value: 1, statistic: 'presence' }],
            } as any,
            {
              name: 'Arrow',
              amount: 12,
            } as any,
          ]}
        />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('Bone Bow')).toBeVisible();
    await expect.element(page.getByText('Cracked but eager.')).toBeVisible();
    await expect.element(page.getByText('d6')).toBeVisible();
    await expect.element(page.getByText(/^Arrow$/)).toBeVisible();
    await expect.element(page.getByText('20s')).toBeVisible();
    await expect.element(page.getByText('+1 presence')).toBeVisible();
    await expect.element(page.getByText(/\+ 12.*Arrow/i)).toBeVisible();
  });

  it('falls back to the item kind when no specific chips apply', async () => {
    await render(
      <BrowserTestProvider>
        <CustomItemPreview
          kind="misc"
          items={[
            {
              name: 'Unlabeled Relic',
            } as any,
          ]}
        />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('Unlabeled Relic')).toBeVisible();
    await expect.element(page.getByText('misc')).toBeVisible();
  });
});
