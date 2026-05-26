import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ComputedModifierDetailsModal from '@/components/molecules/modifiers/ComputedModifierDetailsModal';
import UnitTestProvider from '../../UnitTestProvider';
import { type ComputedModifier } from '@/hooks/models';

describe('ComputedModifierDetailsModal', () => {
  const mockModifier: ComputedModifier = {
    originName: 'Test Item',
    originKey: 'test-item',
    statistic: 'strength',
    value: 2,
    source: 'Heavy Strike ability',
    exclude: ['ranged', 'cast'],
  };

  it('renders correctly when open with a modifier', async () => {
    const onClose = vi.fn();
    render(
      <UnitTestProvider>
        <ComputedModifierDetailsModal
          open={true}
          modifier={mockModifier}
          onClose={onClose}
        />
      </UnitTestProvider>
    );

    // Check title and source
    expect(screen.getByRole('heading', { name: /Effect Details/i })).toBeInTheDocument();
    expect(screen.getByText(/Source/i)).toBeInTheDocument();
    expect(screen.getByText(/From Test Item/i)).toBeInTheDocument();

    // Check effect/source description
    expect(screen.getByText(/^Effect$/i)).toBeInTheDocument();
    expect(screen.getByText(/Heavy Strike ability/i)).toBeInTheDocument();

    // Check stat and value (ModifierStatChip and SignedModifierValue)
    expect(screen.getByText('STRENGTH')).toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();

    // Check applies to (inverse of excluded)
    // allIncludeOptions are melee, ranged, defence, cast, ability
    // excluded: ranged, cast -> applies to: melee, defence, ability
    expect(screen.getByText(/Applies to/i)).toBeInTheDocument();
    // In allIncludeOptions: melee="Melee attacks", defence="Defence rolls", ability="Ability tests"
    expect(screen.getByText(/Melee attacks, Defence rolls, Ability tests/i)).toBeInTheDocument();

  });

  it('renders "None" when all contexts are excluded', async () => {
    const modifier: ComputedModifier = {
      ...mockModifier,
      exclude: ['melee', 'ranged', 'defence', 'cast', 'ability'],
    };

    render(
      <UnitTestProvider>
        <ComputedModifierDetailsModal
          open={true}
          modifier={modifier}
          onClose={vi.fn()}
        />
      </UnitTestProvider>
    );

    expect(screen.getByText(/No tests/i)).toBeInTheDocument();
  });

  it('renders "All" when no contexts are excluded', async () => {
    const modifier: ComputedModifier = {
      ...mockModifier,
      exclude: [],
    };

    render(
      <UnitTestProvider>
        <ComputedModifierDetailsModal
          open={true}
          modifier={modifier}
          onClose={vi.fn()}
        />
      </UnitTestProvider>
    );

    expect(screen.getByText(/All tests/i)).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    render(
      <UnitTestProvider>
        <ComputedModifierDetailsModal
          open={true}
          modifier={mockModifier}
          onClose={onClose}
        />
      </UnitTestProvider>
    );
    const user = userEvent.setup();

    const closeButton = screen.getByRole('button', { name: 'Close', exact: true });
    // Use click and await interaction
    await user.click(closeButton);

    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
