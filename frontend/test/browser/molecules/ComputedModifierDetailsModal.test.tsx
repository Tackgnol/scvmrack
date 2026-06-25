import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import ComputedModifierDetailsModal from '../../../src/components/molecules/modifiers/ComputedModifierDetailsModal';
import BrowserTestProvider from '../BrowserTestProvider';
import { type ComputedModifier } from '../../../src/hooks/models';

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
    await render(
      <BrowserTestProvider>
        <ComputedModifierDetailsModal
          open={true}
          modifier={mockModifier}
          onClose={onClose}
        />
      </BrowserTestProvider>
    );

    // Check title and source
    await expect.element(page.getByRole('heading', { name: /Effect Details/i })).toBeInTheDocument();
    await expect.element(page.getByText(/Source/i)).toBeInTheDocument();
    await expect.element(page.getByText(/From Test Item/i)).toBeInTheDocument();

    // Check effect/source description
    await expect.element(page.getByText(/^Effect$/i)).toBeInTheDocument();
    await expect.element(page.getByText(/Heavy Strike ability/i)).toBeInTheDocument();

    // Check stat and value (ModifierStatChip and SignedModifierValue)
    await expect.element(page.getByText('STRENGTH')).toBeInTheDocument();
    await expect.element(page.getByText('+2')).toBeInTheDocument();

    // Check applies to (inverse of excluded)
    // allIncludeOptions are melee, ranged, defence, cast, ability
    // excluded: ranged, cast -> applies to: melee, defence, ability
    await expect.element(page.getByText(/Applies to/i)).toBeInTheDocument();
    // In allIncludeOptions: melee="Melee attacks", defence="Defence rolls", ability="Ability tests"
    await expect.element(page.getByText(/Melee attacks, Defence rolls, Ability tests/i)).toBeInTheDocument();

  });

  it('renders "None" when all contexts are excluded', async () => {
    const modifier: ComputedModifier = {
      ...mockModifier,
      exclude: ['melee', 'ranged', 'defence', 'cast', 'ability'],
    };

    await render(
      <BrowserTestProvider>
        <ComputedModifierDetailsModal
          open={true}
          modifier={modifier}
          onClose={vi.fn()}
        />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText(/No tests/i)).toBeInTheDocument();
  });

  it('renders "All" when no contexts are excluded', async () => {
    const modifier: ComputedModifier = {
      ...mockModifier,
      exclude: [],
    };

    await render(
      <BrowserTestProvider>
        <ComputedModifierDetailsModal
          open={true}
          modifier={modifier}
          onClose={vi.fn()}
        />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText(/All tests/i)).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    await render(
      <BrowserTestProvider>
        <ComputedModifierDetailsModal
          open={true}
          modifier={mockModifier}
          onClose={onClose}
        />
      </BrowserTestProvider>
    );

    const closeButton = page.getByRole('button', { name: 'Close', exact: true });
    // Use click and await interaction
    await closeButton.click({ force: true });

    await expect.poll(() => onClose).toHaveBeenCalled();
  });
});
