import { render, screen } from '@testing-library/react';
import { expect, describe, it, vi, beforeEach } from 'vitest';
import AbilityCardsGrid from '@/components/molecules/ability/AbilityCardsGrid';
import UnitTestProvider from '../../../UnitTestProvider';
import { CharacterContext } from '@/CharacterContext/CharacterContext';

describe('AbilityCardsGrid Unit', () => {
  const mockCharacter = {
    agility: 12,
    presence: 10,
    strength: 8,
    toughness: 14,
    id: 'test-id',
  };

  const mockUpdateField = vi.fn();

  const mockContextValue = {
    character: mockCharacter,
    updateField: mockUpdateField,
    // Add other required fields from useCurrentCharacter if necessary
  } as any;

  it('renders all ability cards from config', () => {
    render(
      <UnitTestProvider>
        <CharacterContext.Provider value={mockContextValue}>
          <AbilityCardsGrid />
        </CharacterContext.Provider>
      </UnitTestProvider>
    );

    // ABILITY_CARD_CONFIG has 4 abilities: agility, presence, strength, toughness
    // We check for their labels (localized in UnitTestProvider's i18n)
    
    // In en.json (guessed names)
    expect(screen.getByText('Agility', { exact: false })).toBeVisible();
    expect(screen.getByText('Presence', { exact: false })).toBeVisible();
    expect(screen.getByText('Strength', { exact: false })).toBeVisible();
    expect(screen.getByText('Toughness', { exact: false })).toBeVisible();

  });
});
