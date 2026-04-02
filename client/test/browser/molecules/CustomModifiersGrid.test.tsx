import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import CustomModifiersGrid from '../../../src/components/molecules/modifiers/CustomModifiersGrid';
import BrowserTestProvider from '../BrowserTestProvider';
import { type CustomModifier } from '../../../src/hooks/models';

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
    await render(
      <BrowserTestProvider>
        <CustomModifiersGrid
          modifiers={[]}
          removingModifierIds={[]}
          reduceMotion={false}
          onEditModifier={vi.fn()}
          onRemoveModifier={vi.fn()}
        />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText(/No active modifiers/i)).toBeInTheDocument();
  });

  it('renders a list of custom modifier tags', async () => {
    const onEditModifier = vi.fn();
    const onRemoveModifier = vi.fn();
    await render(
      <BrowserTestProvider>
        <CustomModifiersGrid
          modifiers={mockModifiers}
          removingModifierIds={[]}
          reduceMotion={false}
          onEditModifier={onEditModifier}
          onRemoveModifier={onRemoveModifier}
        />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText(/Bleeding/i)).toBeInTheDocument();
    await expect.element(page.getByText(/Rage/i)).toBeInTheDocument();

    // Interaction check - Edit (clicking the tag)
    const bleedingTag = page.getByText('Bleeding');
    await userEvent.click(bleedingTag);
    await expect.poll(() => onEditModifier).toHaveBeenCalledWith(mockModifiers[0]);

    // Interaction check - Remove (clicking the remove button)
    const removeButton = page.getByRole('button', { name: 'Remove modifier: Bleeding', exact: true });
    await userEvent.click(removeButton);
    await expect.poll(() => onRemoveModifier).toHaveBeenCalledWith('mod-1');

  });

  it('hides modifiers that are in removing state', async () => {
    await render(
      <BrowserTestProvider>
        <CustomModifiersGrid
          modifiers={mockModifiers}
          removingModifierIds={['mod-1']}
          reduceMotion={false}
          onEditModifier={vi.fn()}
          onRemoveModifier={vi.fn()}
        />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText(/Bleeding/i)).not.toBeInTheDocument();
    await expect.element(page.getByText(/Rage/i)).toBeInTheDocument();

  });
});
