import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import BrowserTestProvider from '../../BrowserTestProvider';
import ItemStatChips from '@/components/organisms/inventoryItem/ItemStatChips';

describe('ItemStatChips', () => {
  it('renders weapon dice, ammo type, and value chips', async () => {
    await render(
      <BrowserTestProvider>
        <ItemStatChips
          item={{
            name: 'Bow',
            tags: ['weapon'],
            dice: [6],
            ammoType: 'Arrow',
            value: 25,
          } as any}
        />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('d6')).toBeVisible();
    await expect.element(page.getByText('Arrow')).toBeVisible();
    await expect.element(page.getByText('25s')).toBeVisible();
  });

  it('renders armor tier as depleted when current tier is zero', async () => {
    await render(
      <BrowserTestProvider>
        <ItemStatChips
          item={{
            name: 'Broken Mail',
            tags: ['armor'],
            dice: [4],
            currentTier: 0,
            maxTier: 2,
          } as any}
        />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText(/d4/)).toBeVisible();
    await expect.element(page.getByText('tier 0/2')).toBeVisible();
  });

  it('renders ammo stacks and consumable remaining uses', async () => {
    await render(
      <BrowserTestProvider>
        <>
          <ItemStatChips
            item={{
              name: 'Bolts',
              tags: ['ammo'],
              ammoType: 'Bolt',
              amount: 8,
            } as any}
          />
          <ItemStatChips
            item={{
              name: 'Torch',
              tags: ['consumable'],
              uses: [true, false, false],
            } as any}
          />
        </>
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('Bolt')).toBeVisible();
    await expect.element(page.getByText(/8/)).toBeVisible();
    await expect.element(page.getByText('2 / 3 uses')).toBeVisible();
  });

  it('renders nothing when no stat chips apply', async () => {
    await render(
      <BrowserTestProvider>
        <div>
          <span>Before</span>
          <ItemStatChips item={{ name: 'Plain Thing' } as any} />
          <span>After</span>
        </div>
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('Before')).toBeVisible();
    await expect.element(page.getByText('After')).toBeVisible();
    await expect.element(page.getByText('Plain Thing')).not.toBeInTheDocument();
  });
});
