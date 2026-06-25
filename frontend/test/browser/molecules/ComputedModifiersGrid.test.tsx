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
      statistic: 'agility',
      value: 1,
      source: 'Shield bonus',
      exclude: [],
    },
  ];

  it('renders nothing when modifiers list is empty', async () => {
    await render(
      <BrowserTestProvider>
        <ComputedModifiersGrid
          modifiers={[]}
          reduceMotion={true}
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
          reduceMotion={true}
          onOpenModifier={onOpenModifier}
        />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText(/From Equipment/i)).toBeInTheDocument();
    await expect.element(page.getByText('Armor')).toBeInTheDocument();
    await expect.element(page.getByText('Shield')).toBeInTheDocument();

    // Interaction check
    const armorTag = page.getByRole('button', { name: /Armor/i });
    await expect.element(armorTag).toBeVisible();
    await userEvent.click(armorTag);
    await expect.poll(() => onOpenModifier).toHaveBeenCalledWith(mockModifiers[0]);

  });

  it('keeps same-origin class modifiers distinct across equipment changes', async () => {
    const classModifiers: ComputedModifier[] = [
      {
        value: 2,
        source: 'Stealthy',
        statistic: 'agility',
        exclude: [],
        origin: 'system',
        originKey: 'class_ability.abilities.gutterborn_scum.stealthy',
        originName: 'Stealthy',
      },
      {
        value: 2,
        source: 'Stealthy',
        statistic: 'presence',
        exclude: [],
        origin: 'system',
        originKey: 'class_ability.abilities.gutterborn_scum.stealthy',
        originName: 'Stealthy',
      },
    ];
    const weaponModifier: ComputedModifier = {
      value: 4,
      source: 'Sword of strength',
      statistic: 'strength',
      exclude: [],
      origin: 'weapon',
      originKey: 'custom.weapon.ilqp808mpvcxgx2',
      originName: 'Sword of strength',
    };

    const { rerender } = await render(
      <BrowserTestProvider>
        <ComputedModifiersGrid
          modifiers={classModifiers}
          reduceMotion={true}
          onOpenModifier={vi.fn()}
        />
      </BrowserTestProvider>
    );

    await expect
      .poll(async () => page.getByText('Stealthy').all())
      .toHaveLength(2);

    await rerender(
      <BrowserTestProvider>
        <ComputedModifiersGrid
          modifiers={[weaponModifier, ...classModifiers]}
          reduceMotion={true}
          onOpenModifier={vi.fn()}
        />
      </BrowserTestProvider>
    );

    await expect
      .poll(async () => page.getByText('Stealthy').all())
      .toHaveLength(2);
    await expect.element(page.getByText('Sword of strength')).toBeVisible();

    await rerender(
      <BrowserTestProvider>
        <ComputedModifiersGrid
          modifiers={classModifiers}
          reduceMotion={true}
          onOpenModifier={vi.fn()}
        />
      </BrowserTestProvider>
    );

    await expect
      .poll(async () => page.getByText('Stealthy').all())
      .toHaveLength(2);
    await expect
      .element(page.getByText('Sword of strength'))
      .not.toBeInTheDocument();
  });
});
