import { render } from 'vitest-browser-react';
import { expect, describe, it } from 'vitest';
import { page } from 'vitest/browser';
import SummaryCombatBreakdown from '@/components/molecules/summary/SummaryCombatBreakdown';
import BrowserTestProvider from '../../BrowserTestProvider';

describe('SummaryCombatBreakdown Browser', () => {
  const defaultProps = {
    title: 'Dodge',
    abilityModifier: 2,
    currentDr: 10,
    breakdown: {
      modifierTotal: 0,
      applicable: [],
    },
    unknownOriginLabel: 'Unknown',
    modifiersLabel: 'Modifiers',
    noModifiersLabel: 'No modifiers',
    statLabel: 'Agility',
  };

  it('renders base info and no modifiers message', async () => {
    await render(
      <BrowserTestProvider>
        <SummaryCombatBreakdown {...defaultProps} />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('DODGE')).toBeVisible();
    await expect.element(page.getByText('DR 10')).toBeVisible();
    await expect.element(page.getByText('No modifiers')).toBeVisible();
    await expect.element(page.getByText('Base DR')).toBeVisible();
    await expect.element(page.getByText('Agility mod')).toBeVisible();
    // abilityContribution = -abilityModifier = -2
    await expect.element(page.getByText('-2')).toBeVisible();

  });

  it('renders modifiers when applicable', async () => {
    const breakdown = {
      modifierTotal: 1,
      applicable: [
        { listKey: '1', originName: 'Armor', value: 1 },
        { listKey: '2', name: 'Shield', value: -1 },
        { listKey: '3', source: 'Spell', value: 1 },
      ],
    };

    await render(
      <BrowserTestProvider>
        <SummaryCombatBreakdown {...defaultProps} breakdown={breakdown} />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('Armor')).toBeVisible();
    await expect.element(page.getByText('Shield')).toBeVisible();
    await expect.element(page.getByText('Spell')).toBeVisible();
    
    // modifiersContribution = -breakdown.modifierTotal = -1
    // We expect two "-1" elements: one for the "Modifiers" total and one for the "Shield" row
    const minusOnes = await page.getByText('-1').all();
    expect(minusOnes).toHaveLength(2);
    for (const minusOne of minusOnes) {
      await expect.element(minusOne).toBeVisible();
    }

  });
});
