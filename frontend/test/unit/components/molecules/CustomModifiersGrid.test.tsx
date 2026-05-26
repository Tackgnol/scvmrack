import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import CustomModifiersGrid from '@/components/molecules/modifiers/CustomModifiersGrid';
import UnitTestProvider from '../../UnitTestProvider';
import { type CustomModifier } from '@/hooks/models';

describe('CustomModifiersGrid', () => {
  const mockModifiers: CustomModifier[] = [
    {
      id: 'mod-1',
      name: 'Bleeding',
      statistic: 'toughness',
      value: -2,
      comment: 'Losing blood',
    },
    {
      id: 'mod-2',
      name: 'Rage',
      statistic: 'strength',
      value: 1,
      comment: 'Pure anger',
    },
  ];

  it('renders placeholder message when no modifiers are present', async () => {
    render(
      <UnitTestProvider>
        <CustomModifiersGrid
          modifiers={[]}
          removingModifierIds={[]}
          reduceMotion={false}
          onEditModifier={vi.fn()}
          onRemoveModifier={vi.fn()}
        />
      </UnitTestProvider>
    );

    expect(screen.getByText(/No active modifiers/i)).toBeInTheDocument();
  });

  it('renders a list of custom modifier tags', async () => {
    const onEditModifier = vi.fn();
    const onRemoveModifier = vi.fn();
    render(
      <UnitTestProvider>
        <CustomModifiersGrid
          modifiers={mockModifiers}
          removingModifierIds={[]}
          reduceMotion={false}
          onEditModifier={onEditModifier}
          onRemoveModifier={onRemoveModifier}
        />
      </UnitTestProvider>
    );
    const user = userEvent.setup();

    expect(screen.getByText(/Bleeding/i)).toBeInTheDocument();
    expect(screen.getByText(/Rage/i)).toBeInTheDocument();

    // Interaction check - Edit (clicking the tag)
    const bleedingTag = screen.getByText('Bleeding');
    await user.click(bleedingTag);
    await waitFor(() => expect(onEditModifier).toHaveBeenCalledWith(mockModifiers[0]));

    // Interaction check - Remove (clicking the remove button)
    const removeButton = screen.getByRole('button', { name: 'Remove modifier: Bleeding', exact: true });
    await user.click(removeButton);
    await waitFor(() => expect(onRemoveModifier).toHaveBeenCalledWith('mod-1'));

  });

  it('hides modifiers that are in removing state', async () => {
    render(
      <UnitTestProvider>
        <CustomModifiersGrid
          modifiers={mockModifiers}
          removingModifierIds={['mod-1']}
          reduceMotion={false}
          onEditModifier={vi.fn()}
          onRemoveModifier={vi.fn()}
        />
      </UnitTestProvider>
    );

    expect(screen.queryByText(/Bleeding/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Rage/i)).toBeInTheDocument();

  });
});
