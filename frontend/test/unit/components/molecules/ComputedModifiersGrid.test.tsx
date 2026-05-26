import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ComputedModifiersGrid from '@/components/molecules/modifiers/ComputedModifiersGrid';
import UnitTestProvider from '../../UnitTestProvider';
import { type ComputedModifier } from '@/hooks/models';

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
    render(
      <UnitTestProvider>
        <ComputedModifiersGrid
          modifiers={[]}
          reduceMotion={false}
          onOpenModifier={vi.fn()}
        />
      </UnitTestProvider>
    );

    // If it returns null, the test-id should not be found
    expect(screen.queryByText(/From Equipment/i)).not.toBeInTheDocument();
  });

  it('renders a list of modifier tags', async () => {
    const onOpenModifier = vi.fn();
    render(
      <UnitTestProvider>
        <ComputedModifiersGrid
          modifiers={mockModifiers}
          reduceMotion={false}
          onOpenModifier={onOpenModifier}
        />
      </UnitTestProvider>
    );
    const user = userEvent.setup();

    expect(screen.getByText(/From Equipment/i)).toBeInTheDocument();
    expect(screen.getByText('Armor')).toBeInTheDocument();
    expect(screen.getByText('Shield')).toBeInTheDocument();

    // Interaction check
    const armorTag = screen.getByText('Armor');
    await user.click(armorTag);
    await waitFor(() => expect(onOpenModifier).toHaveBeenCalledWith(mockModifiers[0]));

  });
});
