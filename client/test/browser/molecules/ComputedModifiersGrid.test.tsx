import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import ComputedModifiersGrid from '../../../src/components/molecules/modifiers/ComputedModifiersGrid';
import BrowserTestProvider from '../BrowserTestProvider';
import { type ComputedModifier } from '../../../src/hooks/models';

describe('ComputedModifiersGrid', () => {
  const mockModifiers: ComputedModifier[] = [
    {
      originName: 'Armor',
      originKey: 'armor',
      statistic: 'agility',
      value: -1,
      source: 'Heavy Armor penalty',
      exclude: [],
    },
    {
      originName: 'Shield',
      originKey: 'shield',
      statistic: 'defence',
      value: 1,
      source: 'Shield bonus',
      exclude: [],
    },
  ];

  it('renders nothing when modifiers list is empty', async () => {
    const rendered = await render(
      <BrowserTestProvider>
        <ComputedModifiersGrid
          modifiers={[]}
          reduceMotion={false}
          onOpenModifier={vi.fn()}
        />
      </BrowserTestProvider>
    );

    // If it returns null, the test-id should not be found
    await expect.element(page.getByText(/From Equipment/i)).not.toBeInTheDocument();
  });

  it('renders a list of modifier tags', async () => {
    const onOpenModifier = vi.fn();
    await render(
      <BrowserTestProvider>
        <ComputedModifiersGrid
          modifiers={mockModifiers}
          reduceMotion={false}
          onOpenModifier={onOpenModifier}
        />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText(/From Equipment/i)).toBeInTheDocument();
    await expect.element(page.getByText('Armor')).toBeInTheDocument();
    await expect.element(page.getByText('Shield')).toBeInTheDocument();

    // Interaction check
    const armorTag = page.getByText('Armor');
    await userEvent.click(armorTag);
    await expect.poll(() => onOpenModifier).toHaveBeenCalledWith(mockModifiers[0]);

  });
});
